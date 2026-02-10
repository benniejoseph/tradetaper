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
export declare class NoteBlock {
    id: string;
    noteId: string;
    blockType: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table';
    content: NoteBlockContent;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
