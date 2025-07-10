export declare class NoteResponseDto {
    id: string;
    title: string;
    content: any[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
    visibility: string;
    wordCount: number;
    readingTime: number;
    accountId?: string;
    tradeId?: string;
    account?: {
        id: string;
        name: string;
        type?: string;
    };
    trade?: {
        id: string;
        symbol: string;
        side?: string;
        openTime: Date;
    };
    get preview(): string;
    get hasMedia(): boolean;
    get blockCount(): number;
    userId: string;
    deletedAt?: Date;
}
