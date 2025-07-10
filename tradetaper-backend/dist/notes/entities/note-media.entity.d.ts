export declare class NoteMedia {
    id: string;
    noteId: string;
    filename: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    gcsPath: string;
    thumbnailPath?: string;
    createdAt: Date;
    get isImage(): boolean;
    get isVideo(): boolean;
    get isAudio(): boolean;
    get isPdf(): boolean;
    get humanFileSize(): string;
    get signedUrl(): string | null;
    get thumbnailSignedUrl(): string | null;
}
