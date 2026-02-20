"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const storage_1 = require("@google-cloud/storage");
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
let FilesService = FilesService_1 = class FilesService {
    configService;
    logger = new common_1.Logger(FilesService_1.name);
    storage;
    bucket;
    bucketName;
    gcsPublicUrlPrefix;
    usingFallbackCredentials = false;
    constructor(configService) {
        this.configService = configService;
        const keyFilePath = this.configService.get('GOOGLE_APPLICATION_CREDENTIALS');
        const credentialsJson = this.configService.get('GOOGLE_APPLICATION_CREDENTIALS_JSON');
        let storageConfig = {};
        if (credentialsJson) {
            try {
                const credentials = JSON.parse(credentialsJson);
                storageConfig = { credentials };
                this.logger.log('Using GCP credentials from GOOGLE_APPLICATION_CREDENTIALS_JSON (production mode)');
            }
            catch (error) {
                this.logger.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', error.message);
                throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
            }
        }
        else if (keyFilePath) {
            const trimmed = keyFilePath.trim();
            if (trimmed.startsWith('{')) {
                try {
                    const credentials = JSON.parse(trimmed);
                    storageConfig = { credentials };
                    this.logger.log('Using GCP credentials from GOOGLE_APPLICATION_CREDENTIALS JSON content');
                }
                catch (error) {
                    this.logger.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS JSON content:', error.message);
                    throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS JSON format');
                }
            }
            else {
                storageConfig = { keyFilename: keyFilePath };
                this.logger.log(`Using GCP credentials from file: ${keyFilePath} (development mode)`);
            }
        }
        else {
            this.logger.warn('No GCP credentials configured. Attempting to use Application Default Credentials.');
        }
        this.storage = new storage_1.Storage(storageConfig);
    }
    onModuleInit() {
        const bucketNameFromConfig = this.configService.get('GCS_BUCKET_NAME');
        if (!bucketNameFromConfig) {
            this.logger.warn('GCS_BUCKET_NAME is not configured. FilesService will operate in local mode.');
            this.bucketName = '';
            this.bucket = null;
            this.gcsPublicUrlPrefix = '';
        }
        else {
            this.bucketName = bucketNameFromConfig;
            this.bucket = this.storage.bucket(this.bucketName);
            this.gcsPublicUrlPrefix =
                this.configService.get('GCS_PUBLIC_URL_PREFIX') ||
                    `https://storage.googleapis.com/${this.bucketName}`;
            this.logger.log(`FilesService initialized. Target GCS Bucket: ${this.bucketName}`);
            this.logger.log(`Public URL prefix: ${this.gcsPublicUrlPrefix}`);
        }
    }
    async uploadFileToGCS(fileBuffer, originalName, mimetype, userId) {
        if (!this.bucket) {
            this.logger.error('GCS bucket is not initialized. Cannot upload file.');
            throw new common_1.HttpException('File upload service is not configured properly (bucket missing).', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        let uploadBuffer = fileBuffer;
        let uploadMimeType = mimetype;
        let fileExtension = path.extname(originalName) || '.tmp';
        const shouldCompress = ['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype);
        if (shouldCompress) {
            try {
                const image = (0, sharp_1.default)(fileBuffer).rotate();
                const metadata = await image.metadata();
                const resizeWidth = metadata.width && metadata.width > 1600 ? 1600 : metadata.width;
                const pipeline = resizeWidth
                    ? image.resize({ width: resizeWidth, withoutEnlargement: true })
                    : image;
                const processedBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
                uploadBuffer = processedBuffer;
                uploadMimeType = 'image/webp';
                fileExtension = '.webp';
                this.logger.log(`Compressed image upload from ${mimetype} to webp for user ${userId}`);
            }
            catch (error) {
                this.logger.warn(`Image compression failed, using original file: ${error.message}`);
            }
        }
        const uniqueFileName = `${(0, uuid_1.v4)()}${fileExtension}`;
        const gcsFilePath = `users/${userId}/trades/images/${uniqueFileName}`;
        const attemptUpload = async () => {
            if (!this.bucket) {
                throw new common_1.HttpException('File upload service is not configured properly (bucket missing).', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const gcsFile = this.bucket.file(gcsFilePath);
            await gcsFile.save(uploadBuffer, {
                metadata: { contentType: uploadMimeType },
            });
        };
        try {
            await attemptUpload();
        }
        catch (error) {
            const rawMessage = `${error?.message || error}`;
            const safeMessage = this.sanitizeErrorMessage(rawMessage);
            if (!this.usingFallbackCredentials &&
                rawMessage.toLowerCase().includes('invalid_grant')) {
                this.logger.warn('Invalid GCS credential signature detected. Falling back to ADC and retrying upload.');
                this.reinitializeStorageWithADC();
                try {
                    await attemptUpload();
                }
                catch (retryError) {
                    const retryRaw = `${retryError?.message || retryError}`;
                    this.logger.error('Error uploading file to GCS after ADC fallback:', this.sanitizeErrorMessage(retryRaw));
                    throw new common_1.HttpException('Failed to upload file to GCS.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
            else {
                this.logger.error('Error uploading file to GCS:', safeMessage);
                throw new common_1.HttpException('Failed to upload file to GCS.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        this.logger.log(`File uploaded successfully to GCS: gs://${this.bucketName}/${gcsFilePath}`);
        const publicUrl = `${this.gcsPublicUrlPrefix}/${gcsFilePath}`;
        return { url: publicUrl, gcsPath: gcsFilePath };
    }
    reinitializeStorageWithADC() {
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        this.storage = new storage_1.Storage();
        if (this.bucketName) {
            this.bucket = this.storage.bucket(this.bucketName);
        }
        this.usingFallbackCredentials = true;
    }
    sanitizeErrorMessage(message) {
        if (!message)
            return message;
        if (message.includes('"private_key"') ||
            message.includes('BEGIN PRIVATE KEY') ||
            message.includes('"service_account"')) {
            return 'GCS credential error (redacted)';
        }
        return message;
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FilesService);
//# sourceMappingURL=files.service.js.map