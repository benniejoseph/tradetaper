import { MediaService } from './media.service';
import { NoteMedia } from './entities/note-media.entity';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadFile(file: Express.Multer.File, noteId: string, req: any): Promise<NoteMedia>;
    getSignedUrl(mediaId: string, req: any): Promise<{
        url: string;
    }>;
    deleteFile(mediaId: string, req: any): Promise<void>;
    getMediaByNote(noteId: string, req: any): Promise<NoteMedia[]>;
    generateEmbedData(url: string): {
        title: string;
        description: string;
        thumbnail?: string;
    };
}
