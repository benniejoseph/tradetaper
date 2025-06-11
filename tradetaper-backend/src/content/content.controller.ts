import {
  Controller,
  Get,
  Param,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('content')
export class ContentController {
  private readonly contentPath = path.join(process.cwd(), 'content');

  @Get('product-description')
  async getProductDescription(@Res() res: Response) {
    return this.serveContent('PRODUCT_DESCRIPTION.md', res);
  }

  @Get('legal/terms')
  async getTermsOfService(@Res() res: Response) {
    return this.serveContent('legal/TERMS_OF_SERVICE.md', res);
  }

  @Get('legal/privacy')
  async getPrivacyPolicy(@Res() res: Response) {
    return this.serveContent('legal/PRIVACY_POLICY.md', res);
  }

  @Get('legal/cancellation-refund')
  async getCancellationRefundPolicy(@Res() res: Response) {
    return this.serveContent('legal/CANCELLATION_REFUND_POLICY.md', res);
  }

  @Get('support')
  async getSupportGuide(@Res() res: Response) {
    return this.serveContent('support/SUPPORT.md', res);
  }

  @Get('index')
  async getContentIndex(@Res() res: Response) {
    return this.serveContent('INDEX.md', res);
  }

  @Get('legal/:document')
  async getLegalDocument(
    @Param('document') document: string,
    @Res() res: Response,
  ) {
    const allowedDocuments = ['terms', 'privacy', 'cancellation-refund'];
    if (!allowedDocuments.includes(document)) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const fileMap = {
      terms: 'TERMS_OF_SERVICE.md',
      privacy: 'PRIVACY_POLICY.md',
      'cancellation-refund': 'CANCELLATION_REFUND_POLICY.md',
    };

    return this.serveContent(`legal/${fileMap[document]}`, res);
  }

  private async serveContent(relativePath: string, res: Response) {
    try {
      const filePath = path.join(this.contentPath, relativePath);

      // Security check: ensure file is within content directory
      if (!filePath.startsWith(this.contentPath)) {
        throw new HttpException('Invalid file path', HttpStatus.BAD_REQUEST);
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
      }

      const content = fs.readFileSync(filePath, 'utf8');

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(content);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error reading content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
