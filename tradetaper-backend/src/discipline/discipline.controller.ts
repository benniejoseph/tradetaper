import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import {
  CreateApprovalDto,
  ApproveTradeDto,
  CompleteExerciseDto,
  CreateIfThenPlanDto,
  UpdateIfThenPlanDto,
} from './dto/discipline.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  FeatureAccessGuard,
  RequireFeature,
} from '../subscriptions/guards/feature-access.guard';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Controller('discipline')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@RequireFeature('discipline')
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  // ============== DISCIPLINE STATS ==============

  @Get('stats')
  async getStats(@Request() req: AuthenticatedRequest) {
    return this.disciplineService.getDisciplineStats(req.user.id);
  }

  @Get('signals')
  async getSignals(
    @Request() req: AuthenticatedRequest,
    @Query('accountId') accountId?: string,
  ) {
    return this.disciplineService.getBehaviorSignals(req.user.id, accountId);
  }

  // ============== IF-THEN PLANS ==============

  @Get('if-then-plans')
  async getIfThenPlans(
    @Request() req: AuthenticatedRequest,
    @Query('accountId') accountId?: string,
  ) {
    return this.disciplineService.getIfThenPlans(req.user.id, accountId);
  }

  @Post('if-then-plans')
  async createIfThenPlan(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateIfThenPlanDto,
  ) {
    return this.disciplineService.createIfThenPlan(req.user.id, dto);
  }

  @Patch('if-then-plans/:id')
  async updateIfThenPlan(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateIfThenPlanDto,
  ) {
    return this.disciplineService.updateIfThenPlan(req.user.id, id, dto);
  }

  @Delete('if-then-plans/:id')
  async deleteIfThenPlan(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.disciplineService.deleteIfThenPlan(req.user.id, id);
  }

  // ============== TRADE APPROVALS ==============

  @Post('approvals')
  async createApproval(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateApprovalDto,
  ) {
    return this.disciplineService.createApproval(req.user.id, dto);
  }

  @Post('approvals/:id/approve')
  async approveAndUnlock(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ApproveTradeDto,
  ) {
    return this.disciplineService.approveAndUnlock(req.user.id, id, dto);
  }

  @Get('approvals/active')
  async getActiveApproval(@Request() req: AuthenticatedRequest) {
    return this.disciplineService.getActiveApproval(req.user.id);
  }

  @Get('approvals/pending')
  async getPendingApprovals(@Request() req: AuthenticatedRequest) {
    return this.disciplineService.getPendingApprovals(req.user.id);
  }

  @Get('approvals/history')
  async getApprovalHistory(@Request() req: AuthenticatedRequest) {
    return this.disciplineService.getApprovalHistory(req.user.id);
  }

  // ============== COOLDOWNS ==============

  @Get('cooldowns/active')
  async getActiveCooldown(@Request() req: AuthenticatedRequest) {
    return this.disciplineService.getActiveCooldown(req.user.id);
  }

  @Post('cooldowns/:id/complete-exercise')
  async completeExercise(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CompleteExerciseDto,
  ) {
    return this.disciplineService.completeExercise(
      req.user.id,
      id,
      dto.exerciseId,
    );
  }

  @Post('cooldowns/:id/skip')
  async skipCooldown(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.disciplineService.skipCooldown(req.user.id, id);
  }

  @Get('cooldowns/history')
  async getCooldownHistory(@Request() req: AuthenticatedRequest) {
    return this.disciplineService.getCooldownHistory(req.user.id);
  }
}
