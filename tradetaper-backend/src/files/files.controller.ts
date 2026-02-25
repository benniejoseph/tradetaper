/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/files/files.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpException,
  HttpStatus,
  Logger, // Logger is imported
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from '../users/dto/user-response.dto';

// Create a logger instance specifically for the controller or this factory
const controllerLogger = new Logger('FilesControllerValidation'); // Give it a context name

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  // Instance logger can still be used for methods called on an instance
  private readonly instanceLogger = new Logger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  @Post('upload/trade-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTradeImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif|webp)' }),
        ],
        exceptionFactory: (validationErrorString: string | undefined) => {
          const message =
            validationErrorString ||
            'File validation failed with an unknown error.';
          // Use the module-level/static logger instance
          if (validationErrorString) {
            controllerLogger.error(
              `File validation failure: ${message}. Original error string: ${validationErrorString}`,
            );
          } else {
            controllerLogger.error(`File validation failure: ${message}`);
          }
          throw new HttpException(message, HttpStatus.BAD_REQUEST);
        },
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ): Promise<{ url: string; gcsPath?: string; message: string }> {
    // Use instanceLogger for methods called on the controller instance
    this.instanceLogger.log(
      `Received file upload for GCS from user ${req.user.id}: ${file.originalname} (Size: ${file.size}, MimeType: ${file.mimetype})`,
    );
    if (!file) {
      this.instanceLogger.warn(
        `Upload attempt by user ${req.user.id} with no file.`,
      );
      throw new HttpException('No file uploaded.', HttpStatus.BAD_REQUEST);
    }

    const user = req.user as UserResponseDto;
    try {
      const { url, gcsPath } = await this.filesService.uploadFileToGCS(
        file.buffer,
        file.originalname,
        file.mimetype,
        user.id,
      );
      return { url, gcsPath, message: 'File uploaded successfully to GCS' };
    } catch (error) {
      const safeMessage =
        error instanceof HttpException ? error.message : 'File upload failed.';
      this.instanceLogger.error(
        `GCS Upload Controller Error for user ${user.id}: ${safeMessage}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Could not process file upload to GCS due to an internal server error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
