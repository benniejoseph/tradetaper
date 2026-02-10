import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    private readonly instanceLogger;
    constructor(filesService: FilesService);
    uploadTradeImage(file: Express.Multer.File, req: any): Promise<{
        url: string;
        gcsPath?: string;
        message: string;
    }>;
}
