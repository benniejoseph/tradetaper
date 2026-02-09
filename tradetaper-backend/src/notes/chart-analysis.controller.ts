// src/notes/chart-analysis.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  FeatureAccessGuard,
  RequireFeature,
} from '../subscriptions/guards/feature-access.guard';
import { ChartAnalysisService } from './chart-analysis.service';

@Controller('notes/chart-analysis')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@RequireFeature('aiAnalysis')
export class ChartAnalysisController {
  constructor(private readonly chartAnalysisService: ChartAnalysisService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async chartToJournal(@UploadedFile() file: Express.Multer.File) {
    // Placeholder for the chart analysis logic
    return this.chartAnalysisService.analyzeChart(file);
  }
}
