import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { VectorEmbedding } from './vector-embedding.entity';

@Entity('knowledge_documents')
export class KnowledgeDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({
    type: 'enum',
    enum: ['transcript', 'pdf', 'text', 'markdown'],
    default: 'text',
  })
  type: string;

  @Column({ default: 'processing' })
  status: 'processing' | 'ready' | 'error';

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  chunkCount: number;

  @OneToMany(() => VectorEmbedding, (embedding) => embedding.document)
  embeddings: VectorEmbedding[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
