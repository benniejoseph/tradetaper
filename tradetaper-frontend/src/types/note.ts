// Note-related types for the frontend

export interface NoteBlock {
  id: string;
  type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table';
  content: any;
  position: number;
}

export interface Note {
  id: string;
  title: string;
  content: NoteBlock[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  visibility: 'private' | 'shared';
  wordCount: number;
  readingTime: number;
  accountId?: string;
  tradeId?: string;
  preview: string;
  hasMedia: boolean;
  blockCount: number;
}

export interface CreateNoteRequest {
  title: string;
  content?: NoteBlock[];
  tags?: string[];
  visibility?: 'private' | 'shared';
  accountId?: string;
  tradeId?: string;
  isPinned?: boolean;
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {}

export interface NotesResponse {
  notes: Note[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchNotesParams {
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
  pinnedOnly?: boolean;
  hasMedia?: boolean;
}

export interface NotesStats {
  totalNotes: number;
  totalWords: number;
  totalReadingTime: number;
  pinnedNotes: number;
  notesWithMedia: number;
  averageWordsPerNote: number;
  mostUsedTags: { tag: string; count: number }[];
}

export interface CalendarNote {
  date: string;
  count: number;
  notes: Note[];
}

export interface NoteMedia {
  id: string;
  noteId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  gcsPath: string;
  thumbnailPath?: string;
  createdAt: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isPdf: boolean;
  humanFileSize: string;
}

// Block content types
export interface TextBlockContent {
  text: string;
}

export interface HeadingBlockContent {
  text: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface QuoteBlockContent {
  text: string;
  author?: string;
}

export interface ListBlockContent {
  items: string[];
  ordered: boolean;
}

export interface CodeBlockContent {
  code: string;
  language: string;
}

export interface ImageBlockContent {
  url: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface VideoBlockContent {
  url: string;
  caption?: string;
  thumbnail?: string;
}

export interface EmbedBlockContent {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  provider?: string;
}

export interface CalloutBlockContent {
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
  icon?: string;
}

export interface TableBlockContent {
  headers: string[];
  rows: string[][];
}

export interface DividerBlockContent {
  style?: 'solid' | 'dashed' | 'dotted';
}

// Voice recording types
export interface VoiceRecording {
  id: string;
  blob: Blob;
  duration: number;
  transcript?: string;
  isTranscribing: boolean;
  error?: string;
}

export interface SpeechToTextResponse {
  transcript: string;
  confidence: number;
  error?: string;
} 