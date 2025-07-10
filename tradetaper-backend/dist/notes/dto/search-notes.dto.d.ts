export declare class SearchNotesDto {
    search?: string;
    tags?: string[];
    accountId?: string;
    tradeId?: string;
    visibility?: 'private' | 'shared' | 'all';
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'wordCount';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
    page?: number;
    pinnedOnly?: boolean;
    isPinned?: boolean;
    hasMedia?: boolean;
}
