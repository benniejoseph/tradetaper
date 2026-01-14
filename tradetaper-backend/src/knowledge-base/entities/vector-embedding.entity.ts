import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { KnowledgeDocument } from './knowledge-document.entity';

@Entity('vector_embeddings')
export class VectorEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  // 768 dimensions for Gemini text-embedding-004
  @Column({ type: 'vector', width: 768 })
  embedding: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => KnowledgeDocument, (doc) => doc.embeddings, {
    onDelete: 'CASCADE',
  })
  document: KnowledgeDocument;

  @CreateDateColumn()
  createdAt: Date;
}
