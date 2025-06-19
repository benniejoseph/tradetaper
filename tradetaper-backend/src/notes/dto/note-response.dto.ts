import { Exclude, Expose, Transform } from 'class-transformer';

export class NoteResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  content: any[];

  @Expose()
  tags: string[];

  @Expose()
  @Transform(({ obj }) => obj.created_at || obj.createdAt)
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.updated_at || obj.updatedAt)
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.is_pinned || obj.isPinned)
  isPinned: boolean;

  @Expose()
  visibility: string;

  @Expose()
  @Transform(({ obj }) => obj.word_count || obj.wordCount)
  wordCount: number;

  @Expose()
  @Transform(({ obj }) => obj.reading_time || obj.readingTime)
  readingTime: number;

  @Expose()
  @Transform(({ obj }) => obj.account_id || obj.accountId)
  accountId?: string;

  @Expose()
  @Transform(({ obj }) => obj.trade_id || obj.tradeId)
  tradeId?: string;

  @Expose()
  account?: {
    id: string;
    name: string;
    type?: string;
  };

  @Expose()
  trade?: {
    id: string;
    symbol: string;
    side?: string;
    openTime: Date;
  };

  // Computed properties
  @Expose()
  get preview(): string {
    if (!this.content || this.content.length === 0) return '';
    
    const textBlocks = this.content.filter(block => 
      ['text', 'heading', 'quote'].includes(block.type)
    );
    
    if (textBlocks.length === 0) return '';
    
    const firstBlock = textBlocks[0];
    const text = firstBlock.content?.text || '';
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  @Expose()
  get hasMedia(): boolean {
    return this.content?.some(block => 
      ['image', 'video', 'embed'].includes(block.type)
    ) || false;
  }

  @Expose()
  get blockCount(): number {
    return this.content?.length || 0;
  }

  // Hide sensitive fields
  @Exclude()
  userId: string;

  @Exclude()
  deletedAt?: Date;
} 