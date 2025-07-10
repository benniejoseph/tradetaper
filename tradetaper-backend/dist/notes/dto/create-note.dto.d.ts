export declare class CreateNoteDto {
    title: string;
    content?: any[];
    tags?: string[];
    accountId?: string;
    tradeId?: string;
    visibility?: 'private' | 'shared';
    isPinned?: boolean;
}
