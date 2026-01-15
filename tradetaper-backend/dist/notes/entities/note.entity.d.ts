import { PsychologicalInsight } from './psychological-insight.entity';
import { User } from '../../users/entities/user.entity';
import { Account } from '../../users/entities/account.entity';
import { MT5Account } from '../../users/entities/mt5-account.entity';
import { Trade } from '../../trades/entities/trade.entity';
export interface NoteContentBlock {
    id: string;
    type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table';
    content: any;
    position: number;
}
export declare class Note {
    id: string;
    userId: string;
    accountId?: string;
    tradeId?: string;
    mt5AccountId?: string;
    title: string;
    content: NoteContentBlock[];
    tags: string[];
    chartImageUrl?: string;
    chartAnalysisData?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    isPinned: boolean;
    visibility: 'private' | 'shared';
    wordCount: number;
    readingTime: number;
    psychologicalTags?: string[];
    user: User;
    account?: Account;
    mt5Account?: MT5Account;
    trade?: Trade;
    psychologicalInsights: PsychologicalInsight[];
    get preview(): string;
    get hasMedia(): boolean;
    get blockCount(): number;
}
