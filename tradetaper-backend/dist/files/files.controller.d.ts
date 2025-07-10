import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    private readonly instanceLogger;
    constructor(filesService: FilesService);
    uploadTradeImage(file: any, req: any): Promise<{
        url: string;
        gcsPath?: string;
        message: string;
    }>;
}
