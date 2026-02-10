import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
// import { Note } from './note.entity'; // Commented to avoid circular import

export interface NoteBlockContent {
  text?: string;
  url?: string;
  caption?: string;
  language?: string;
  type?: string;
  items?: string[];
  ordered?: boolean;
  author?: string;
  code?: string;
  headers?: string[];
  rows?: string[][];
  [key: string]: unknown;
}

@Entity('note_blocks')
export class NoteBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'note_id' })
  noteId: string;

  @Column({ name: 'block_type', length: 50 })
  blockType:
    | 'text'
    | 'heading'
    | 'quote'
    | 'list'
    | 'code'
    | 'image'
    | 'video'
    | 'embed'
    | 'divider'
    | 'callout'
    | 'table';

  @Column({ type: 'jsonb', default: {} })
  content: NoteBlockContent;

  @Column()
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationship commented to avoid circular import
  // @ManyToOne(() => Note, (note) => note.blocks, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'note_id' })
  // note: Note;
}
