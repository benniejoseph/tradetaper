"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FilesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const files_service_1 = require("./files.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const controllerLogger = new common_1.Logger('FilesControllerValidation');
let FilesController = FilesController_1 = class FilesController {
    filesService;
    instanceLogger = new common_1.Logger(FilesController_1.name);
    constructor(filesService) {
        this.filesService = filesService;
    }
    async uploadTradeImage(file, req) {
        this.instanceLogger.log(`Received file upload for GCS from user ${req.user.id}: ${file.originalname} (Size: ${file.size}, MimeType: ${file.mimetype})`);
        if (!file) {
            this.instanceLogger.warn(`Upload attempt by user ${req.user.id} with no file.`);
            throw new common_1.HttpException('No file uploaded.', common_1.HttpStatus.BAD_REQUEST);
        }
        const user = req.user;
        try {
            const { url, gcsPath } = await this.filesService.uploadFileToGCS(file.buffer, file.originalname, file.mimetype, user.id);
            return { url, gcsPath, message: 'File uploaded successfully to GCS' };
        }
        catch (error) {
            this.instanceLogger.error(`GCS Upload Controller Error for user ${user.id}: Message: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.HttpException('Could not process file upload to GCS due to an internal server error.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload/trade-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
            new common_1.FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif|webp)' }),
        ],
        exceptionFactory: (validationErrorString) => {
            const message = validationErrorString ||
                'File validation failed with an unknown error.';
            if (validationErrorString) {
                controllerLogger.error(`File validation failure: ${message}. Original error string: ${validationErrorString}`);
            }
            else {
                controllerLogger.error(`File validation failure: ${message}`);
            }
            throw new common_1.HttpException(message, common_1.HttpStatus.BAD_REQUEST);
        },
    }))),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadTradeImage", null);
exports.FilesController = FilesController = FilesController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map