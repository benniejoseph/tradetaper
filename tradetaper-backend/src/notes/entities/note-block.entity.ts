import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Note } from './note.entity';

@Entity('note_blocks')
@Index(['noteId', 'position'])
export class NoteBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'note_id' })
  @Index()
  noteId: string;

  @Column({ name: 'block_type', length: 50 })
  @Index()
  blockType: string;

  @Column({ type: 'jsonb', default: {} })
  content: any;

  @Column()
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Note, (note) => note.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note: Note;
} 