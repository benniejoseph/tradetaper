import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import { VectorEmbedding } from './entities/vector-embedding.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;

  constructor(
    @InjectRepository(KnowledgeDocument)
    private docRepo: Repository<KnowledgeDocument>,
    @InjectRepository(VectorEmbedding)
    private vectorRepo: Repository<VectorEmbedding>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in config');
      throw new Error('GEMINI_API_KEY required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: 'text-embedding-004',
    });
  }

  /**
   * Ingest a raw text document (transcript, article, etc.)
   */
  async ingestText(
    title: string,
    content: string,
    sourceType: 'transcript' | 'text' = 'text',
  ): Promise<KnowledgeDocument> {
    this.logger.log(`Ingesting document: "${title}" (${content.length} chars)`);

    // 1. Create Document Record
    const doc = this.docRepo.create({
      filename: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      type: sourceType,
      status: 'processing',
    });
    await this.docRepo.save(doc);

    try {
      // 2. Chunk the text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.createDocuments([content]);
      
      this.logger.log(`Split into ${chunks.length} chunks. Generating embeddings...`);

      // 3. Generate Embeddings & Save
      const embeddingEntities: VectorEmbedding[] = [];
      const batchSize = 10; // Avoid rate limits

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (chunk) => {
            const embedding = await this.generateEmbedding(chunk.pageContent);
            const entity = this.vectorRepo.create({
              content: chunk.pageContent,
              embedding: JSON.stringify(embedding), // pgvector expects string representation or array
              document: doc,
              metadata: { loc: chunk.metadata.loc },
            });
            embeddingEntities.push(entity);
          })
        );
      }

      await this.vectorRepo.save(embeddingEntities);

      // 4. Update Document Status
      doc.status = 'ready';
      doc.chunkCount = chunks.length;
      await this.docRepo.save(doc);

      this.logger.log(`Document "${title}" ready with ${chunks.length} vectors.`);
      return doc;
    } catch (error) {
      this.logger.error(`Ingestion failed for "${title}": ${error.message}`);
      doc.status = 'error';
      doc.errorMessage = error.message;
      await this.docRepo.save(doc);
      throw error;
    }
  }

  /**
   * Search the Knowledge Base
   */
  async search(query: string, limit = 5): Promise<VectorEmbedding[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // Perform cosine distance search using pgvector operator (<=>)
    // Note: ensure 'vector' extension is enabled in DB
    const results = await this.vectorRepo
      .createQueryBuilder('ve')
      .leftJoinAndSelect('ve.document', 'doc')
      .orderBy(`ve.embedding <=> '${vectorStr}'`)
      .limit(limit)
      .getMany(); // TypeORM might not natively support ordering by operator without raw query, checking support

    // Fallback to raw query if Builder issues arise, but this is standard pattern
    return results;
  }
  
  /**
   * Generate embedding for a single string with retry
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            lastError = error;
            if (error.message.includes('429')) {
                const waitTime = 1000 * Math.pow(2, i); // 1s, 2s, 4s
                this.logger.warn(`Embedding 429, retrying in ${waitTime}ms...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            throw error; // Rethrow non-429s immediately
        }
    }
    throw lastError;
  }
}
