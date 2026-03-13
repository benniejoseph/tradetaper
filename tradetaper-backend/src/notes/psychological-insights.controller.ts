import {
  Controller,
  Post,
  Param,
  Get,
  BadRequestException,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PsychologicalInsightsService } from './psychological-insights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import {
  FeatureAccessGuard,
  RequireFeature,
} from '../subscriptions/guards/feature-access.guard';

const parseOptionalDate = (
  value: string | undefined,
  fieldName: string,
): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }
  return parsed;
};

const parseOptionalInt = (
  value: string | undefined,
  fieldName: string,
  min: number,
  max: number,
): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequestException(
      `${fieldName} must be an integer between ${min} and ${max}`,
    );
  }
  return parsed;
};

@Controller('notes/:noteId/psychological-insights')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@RequireFeature('psychology')
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
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.psychologicalInsightsService.getInsightsForNote(
      noteId,
      req.user.id,
      parseOptionalDate(startDate, 'startDate'),
      parseOptionalDate(endDate, 'endDate'),
      parseOptionalInt(limit, 'limit', 1, 200),
      parseOptionalInt(offset, 'offset', 0, 100000),
    );
  }
}

@Controller('psychological-profile')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@RequireFeature('psychology')
export class PsychologicalProfileController {
  constructor(
    private readonly psychologicalInsightsService: PsychologicalInsightsService,
  ) {}

  @Get()
  async getProfile(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.id;
    return this.psychologicalInsightsService.getPsychologicalProfile(
      userId,
      parseOptionalDate(startDate, 'startDate'),
      parseOptionalDate(endDate, 'endDate'),
      accountId,
      parseOptionalInt(limit, 'limit', 1, 200),
      parseOptionalInt(offset, 'offset', 0, 100000),
    );
  }

  @Get('summary')
  async getProfileSummary(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
  ) {
    const userId = req.user.id;
    return this.psychologicalInsightsService.getPsychologicalSummary(
      userId,
      parseOptionalDate(startDate, 'startDate'),
      parseOptionalDate(endDate, 'endDate'),
      accountId,
    );
  }
}
