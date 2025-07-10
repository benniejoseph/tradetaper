
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Note } from '../notes/entities/note.entity';

@Entity('psychological_insights')
@Index(['userId'])
@Index(['noteId'])
export class PsychologicalInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.psychologicalInsights)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'note_id', nullable: true })
  noteId: string | null;

  @ManyToOne(() => Note, note => note.psychologicalInsights, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'note_id' })
  note: Note | null;

  @Column({ type: 'varchar', length: 255, name: 'insight_type' })
  insightType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sentiment: string | null;

  @Column({ type: 'float', name: 'confidence_score', nullable: true })
  confidenceScore: number | null;

  @Column({ type: 'text', name: 'extracted_text', nullable: true })
  extractedText: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'analysis_date' })
  analysisDate: Date;

  @Column({ type: 'jsonb', name: 'raw_gemini_response', nullable: true })
  rawGeminiResponse: object | null;
}
