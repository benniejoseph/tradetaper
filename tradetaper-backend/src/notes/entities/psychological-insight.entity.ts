import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Note } from './note.entity';

@Entity('psychological_insights')
export class PsychologicalInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  noteId: string;

  @ManyToOne(() => Note)
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column()
  insightType: string;

  @Column()
  sentiment: string;

  @Column('float')
  confidenceScore: number;

  @Column('text')
  extractedText: string;

  @CreateDateColumn()
  analysisDate: Date;

  @Column('jsonb', { nullable: true })
  rawGeminiResponse: any;
}
