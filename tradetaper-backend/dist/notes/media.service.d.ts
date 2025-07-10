import { Repository } from 'typeorm';
import { NoteMedia } from './entities/note-media.entity';
import { Note } from './entities/note.entity';
export declare class MediaService {
    private mediaRepository;
    private noteRepository;
    private bucketName;
    constructor(mediaRepository: Repository<NoteMedia>, noteRepository: Repository<Note>);
    uploadFile(file: Express.Multer.File, noteId: string, userId: string): Promise<NoteMedia>;
    private validateFile;
    deleteFile(mediaId: string, userId: string): Promise<void>;
    getSignedUrl(mediaId: string, userId: string): Promise<string>;
    getMediaByNote(noteId: string, userId: string): Promise<NoteMedia[]>;
}
