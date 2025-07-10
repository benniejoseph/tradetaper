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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const note_media_entity_1 = require("./entities/note-media.entity");
const note_entity_1 = require("./entities/note.entity");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let MediaService = class MediaService {
    mediaRepository;
    noteRepository;
    bucketName = 'tradetaper-storage';
    constructor(mediaRepository, noteRepository) {
        this.mediaRepository = mediaRepository;
        this.noteRepository = noteRepository;
    }
    async uploadFile(file, noteId, userId) {
        this.validateFile(file);
        const note = await this.noteRepository.findOne({
            where: { id: noteId, userId },
        });
        if (!note) {
            throw new common_1.BadRequestException('Note not found or access denied');
        }
        try {
            const fileExtension = path.extname(file.originalname);
            const fileName = `notes/${noteId}/${(0, uuid_1.v4)()}${fileExtension}`;
            let processedBuffer = file.buffer;
            let thumbnailPath;
            const media = this.mediaRepository.create({
                noteId,
                filename: fileName,
                originalName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size,
                gcsPath: `gs://${this.bucketName}/${fileName}`,
                thumbnailPath,
            });
            const savedMedia = await this.mediaRepository.save(media);
            return savedMedia;
        }
        catch (error) {
            console.error('Error uploading file:', error);
            throw new common_1.BadRequestException('Failed to upload file');
        }
    }
    validateFile(file) {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'audio/mpeg',
            'audio/wav',
            'audio/mp4',
            'audio/webm',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`File type ${file.mimetype} is not allowed`);
        }
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('File size exceeds 50MB limit');
        }
    }
    async deleteFile(mediaId, userId) {
        const media = await this.mediaRepository.findOne({
            where: { id: mediaId },
            relations: ['note'],
        });
        if (!media) {
            throw new common_1.BadRequestException('Media not found');
        }
        const note = await this.noteRepository.findOne({
            where: { id: media.noteId, userId },
        });
        if (!note) {
            throw new common_1.BadRequestException('Access denied');
        }
        try {
            await this.mediaRepository.delete(mediaId);
        }
        catch (error) {
            console.error('Error deleting file:', error);
            throw new common_1.BadRequestException('Failed to delete file');
        }
    }
    async getSignedUrl(mediaId, userId) {
        const media = await this.mediaRepository.findOne({
            where: { id: mediaId },
        });
        if (!media) {
            throw new common_1.BadRequestException('Media not found');
        }
        const note = await this.noteRepository.findOne({
            where: { id: media.noteId, userId },
        });
        if (!note) {
            throw new common_1.BadRequestException('Access denied');
        }
        try {
            return `https://placeholder.example.com/${media.filename}`;
        }
        catch (error) {
            console.error('Error generating signed URL:', error);
            throw new common_1.BadRequestException('Failed to generate file URL');
        }
    }
    async getMediaByNote(noteId, userId) {
        const note = await this.noteRepository.findOne({
            where: { id: noteId, userId },
        });
        if (!note) {
            throw new common_1.BadRequestException('Note not found or access denied');
        }
        return this.mediaRepository.find({
            where: { noteId },
            order: { createdAt: 'ASC' },
        });
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(note_media_entity_1.NoteMedia)),
    __param(1, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MediaService);
//# sourceMappingURL=media.service.js.map