import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsychologicalInsight } from './entities/psychological-insight.entity';
import { Note } from './entities/note.entity';
import { GeminiPsychologyService } from './gemini-psychology.service';

@Injectable()
export class PsychologicalInsightsService {
  private readonly logger = new Logger(PsychologicalInsightsService.name);

  constructor(
    @InjectRepository(PsychologicalInsight)
    private psychologicalInsightRepository: Repository<PsychologicalInsight>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    private geminiPsychologyService: GeminiPsychologyService,
  ) {}

  async analyzeAndSavePsychologicalInsights(
    noteId: string,
    userId: string,
  ): Promise<PsychologicalInsight[]> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId: userId },
    });

    if (!note) {
      this.logger.warn(`Note with ID ${noteId} not found for user ${userId}`);
      return [];
    }

    // Combine relevant text content from the note for analysis
    const noteText = note.content
      .filter(
        (block) =>
          block.type === 'text' ||
          block.type === 'heading' ||
          block.type === 'quote',
      )
      .map((block) => block.content?.text)
      .join('\n');

    if (!noteText.trim()) {
      this.logger.log(
        `Note ${noteId} has no text content for psychological analysis.`,
      );
      return [];
    }

    try {
      this.logger.log(`Analyzing psychological insights for note ${noteId}...`);
      const insights =
        await this.geminiPsychologyService.analyzePsychologicalPatterns(
          noteText,
        );

      const savedInsights: PsychologicalInsight[] = [];
      for (const insight of insights) {
        const newInsight = this.psychologicalInsightRepository.create({
          userId: userId,
          noteId: noteId,
          insightType: insight.insightType,
          sentiment: insight.sentiment || null,
          confidenceScore: insight.confidenceScore || null,
          extractedText: insight.extractedText || null,
          rawGeminiResponse: insight.rawGeminiResponse || null,
        });
        savedInsights.push(
          await this.psychologicalInsightRepository.save(newInsight),
        );
      }

      this.logger.log(
        `Saved ${savedInsights.length} psychological insights for note ${noteId}.`,
      );
      return savedInsights;
    } catch (error) {
      this.logger.error(
        `Failed to analyze psychological insights for note ${noteId}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to propagate the error
    }
  }

  async getPsychologicalProfile(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PsychologicalInsight[]> {
    const query = this.psychologicalInsightRepository
      .createQueryBuilder('insight')
      .where('insight.userId = :userId', { userId });

    if (startDate) {
      query.andWhere('insight.analysisDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('insight.analysisDate <= :endDate', { endDate });
    }

    return query.getMany();
  }

  async getPsychologicalSummary(userId: string): Promise<any> {
    const insights = await this.getPsychologicalProfile(userId);

    const summary = {
      totalInsights: insights.length,
      insightTypeCounts: {},
      sentimentCounts: {},
      averageConfidence: 0,
    };

    let totalConfidence = 0;
    insights.forEach((insight) => {
      summary.insightTypeCounts[insight.insightType] =
        (summary.insightTypeCounts[insight.insightType] || 0) + 1;
      if (insight.sentiment) {
        summary.sentimentCounts[insight.sentiment] =
          (summary.sentimentCounts[insight.sentiment] || 0) + 1;
      }
      if (insight.confidenceScore !== null) {
        totalConfidence += insight.confidenceScore;
      }
    });

    summary.averageConfidence =
      insights.length > 0 ? totalConfidence / insights.length : 0;

    return summary;
  }
}
