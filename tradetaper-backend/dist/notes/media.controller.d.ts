import { MediaService } from './media.service';
import { NoteMedia } from './entities/note-media.entity';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadFile(file: Express.Multer.File, noteId: string, req: AuthenticatedRequest): Promise<NoteMedia>;
    getSignedUrl(mediaId: string, req: AuthenticatedRequest): Promise<{
        url: string;
    }>;
    deleteFile(mediaId: string, req: AuthenticatedRequest): Promise<void>;
    getMediaByNote(noteId: string, req: AuthenticatedRequest): Promise<NoteMedia[]>;
    generateEmbedData(url: string): {
        title: string;
        description: string;
        thumbnail?: string;
    };
}
