import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { PsychologicalInsight } from './psychological-insight.entity';
import { User } from '../../users/entities/user.entity';
import { Account } from '../../users/entities/account.entity';
import { Trade } from '../../trades/entities/trade.entity';
// Forward declarations to avoid circular imports
// import { NoteBlock } from './note-block.entity';
// import { NoteMedia } from './note-media.entity';

export interface NoteContentBlock {
  id: string;
  type:
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
  content: any;
  position: number;
}

@Entity('notes')
@Index(['userId', 'createdAt'])
@Index(['accountId'])
@Index(['tradeId'])
@Index(['tags'])
@Index(['visibility'])
@Index(['isPinned'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'account_id', nullable: true })
  accountId?: string;

  @Column({ name: 'trade_id', nullable: true })
  tradeId?: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'jsonb', default: [] })
  content: NoteContentBlock[];

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ length: 20, default: 'private' })
  visibility: 'private' | 'shared';

  @Column({ name: 'word_count', default: 0 })
  wordCount: number;

  @Column({ name: 'reading_time', default: 0 })
  readingTime: number;

  @Column({ type: 'simple-array', nullable: true, name: 'psychological_tags' })
  psychologicalTags?: string[];

  // Relationships
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Account, { eager: false, nullable: true })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  @ManyToOne(() => Trade, { eager: false, nullable: true })
  @JoinColumn({ name: 'trade_id' })
  trade?: Trade;

  // Note: Relationships to blocks and media are handled via separate queries
  // to avoid circular import issues

  @OneToMany(() => PsychologicalInsight, psychologicalInsight => psychologicalInsight.note)
  psychologicalInsights: PsychologicalInsight[];

  // Virtual computed properties
  get preview(): string {
    if (!this.content || this.content.length === 0) return '';

    const textBlocks = this.content.filter((block) =>
      ['text', 'heading', 'quote'].includes(block.type),
    );

    if (textBlocks.length === 0) return '';

    const firstBlock = textBlocks[0];
    const text = firstBlock.content?.text || '';
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  get hasMedia(): boolean {
    return (
      this.content?.some((block) =>
        ['image', 'video', 'embed'].includes(block.type),
      ) || false
    );
  }

  get blockCount(): number {
    return this.content?.length || 0;
  }
}
