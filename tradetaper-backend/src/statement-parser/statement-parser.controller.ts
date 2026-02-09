// src/statement-parser/statement-parser.controller.ts
import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatementParserService } from './statement-parser.service';
import { StatementUploadResponseDto } from './dto/upload-statement.dto';

@Controller('statement-upload')
@UseGuards(JwtAuthGuard)
export class StatementParserController {
  constructor(
    private readonly statementParserService: StatementParserService,
  ) {}

  /**
   * Upload and process a statement file
   * Accepts: MT4 HTML, MT5 CSV, MT5 HTML
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, callback) => {
        const allowed = /\.(csv|html|htm)$/i;
        if (!file.originalname.match(allowed)) {
          return callback(
            new BadRequestException('Only CSV and HTML files are supported'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadStatement(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('accountId') accountId?: string,
  ): Promise<StatementUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.statementParserService.processUpload(
      file,
      req.user.id,
      accountId,
    );
  }

  /**
   * Get upload history for current user
   */
  @Get('history')
  async getUploadHistory(
    @Request() req,
  ): Promise<StatementUploadResponseDto[]> {
    return this.statementParserService.getUploadHistory(req.user.id);
  }
}
