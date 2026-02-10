export declare class CreateNoteDto {
    title: string;
    content?: Record<string, unknown>[];
    tags?: string[];
    accountId?: string;
    tradeId?: string;
    visibility?: 'private' | 'shared';
    isPinned?: boolean;
}
