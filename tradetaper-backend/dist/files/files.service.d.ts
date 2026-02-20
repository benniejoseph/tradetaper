import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class FilesService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private storage;
    private bucket;
    private bucketName;
    private gcsPublicUrlPrefix;
    private usingFallbackCredentials;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    uploadFileToGCS(fileBuffer: Buffer, originalName: string, mimetype: string, userId: string): Promise<{
        url: string;
        gcsPath: string;
    }>;
    private reinitializeStorageWithADC;
    private sanitizeErrorMessage;
}
