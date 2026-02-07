import {
  Controller,
  Post,
  Param,
  Get,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PsychologicalInsightsService } from './psychological-insights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Controller('notes/:noteId/psychological-insights')
@UseGuards(JwtAuthGuard)
export class PsychologicalInsightsController {
  constructor(
    private readonly psychologicalInsightsService: PsychologicalInsightsService,
  ) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeNote(
    @Param('noteId') noteId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.psychologicalInsightsService.analyzeAndSavePsychologicalInsights(
      noteId,
      userId,
    );
  }

  @Get()
  async getInsightsForNote(
    @Param('noteId') noteId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // This is a simple implementation. You might want to add more specific logic
    // to fetch insights related to a specific note if needed.
    // The current getPsychologicalProfile gets all insights for a user.
    return this.psychologicalInsightsService.getPsychologicalProfile(req.user.id);
  }
}

@Controller('psychological-profile')
@UseGuards(JwtAuthGuard)
export class PsychologicalProfileController {
    constructor(
        private readonly psychologicalInsightsService: PsychologicalInsightsService,
    ) {}

    @Get()
    async getProfile(
        @Req() req: AuthenticatedRequest,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const userId = req.user.id;
        return this.psychologicalInsightsService.getPsychologicalProfile(
            userId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('summary')
    async getProfileSummary(@Req() req: AuthenticatedRequest) {
        const userId = req.user.id;
        return this.psychologicalInsightsService.getPsychologicalSummary(userId);
    }
} 