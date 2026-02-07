import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { CreateApprovalDto, ApproveTradeDto, CompleteExerciseDto } from './dto/discipline.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureAccessGuard, RequireFeature } from '../subscriptions/guards/feature-access.guard';

@Controller('discipline')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@RequireFeature('discipline')
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  // ============== DISCIPLINE STATS ==============

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.disciplineService.getDisciplineStats(req.user.id);
  }

  // ============== TRADE APPROVALS ==============

  @Post('approvals')
  async createApproval(@Request() req: any, @Body() dto: CreateApprovalDto) {
    return this.disciplineService.createApproval(req.user.id, dto);
  }

  @Post('approvals/:id/approve')
  async approveAndUnlock(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ApproveTradeDto,
  ) {
    return this.disciplineService.approveAndUnlock(req.user.id, id, dto);
  }

  @Get('approvals/active')
  async getActiveApproval(@Request() req: any) {
    return this.disciplineService.getActiveApproval(req.user.id);
  }

  @Get('approvals/pending')
  async getPendingApprovals(@Request() req: any) {
    return this.disciplineService.getPendingApprovals(req.user.id);
  }

  @Get('approvals/history')
  async getApprovalHistory(@Request() req: any) {
    return this.disciplineService.getApprovalHistory(req.user.id);
  }

  // ============== COOLDOWNS ==============

  @Get('cooldowns/active')
  async getActiveCooldown(@Request() req: any) {
    return this.disciplineService.getActiveCooldown(req.user.id);
  }

  @Post('cooldowns/:id/complete-exercise')
  async completeExercise(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CompleteExerciseDto,
  ) {
    return this.disciplineService.completeExercise(req.user.id, id, dto.exerciseId);
  }

  @Post('cooldowns/:id/skip')
  async skipCooldown(@Request() req: any, @Param('id') id: string) {
    return this.disciplineService.skipCooldown(req.user.id, id);
  }

  @Get('cooldowns/history')
  async getCooldownHistory(@Request() req: any) {
    return this.disciplineService.getCooldownHistory(req.user.id);
  }
}
