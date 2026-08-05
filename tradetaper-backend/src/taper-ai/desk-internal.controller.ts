// src/taper-ai/desk-internal.controller.ts
import {
  Controller,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeskOrchestratorService } from './desk-orchestrator.service';
import { InternalTaskGuard } from './guards/internal-task.guard';

/**
 * Cloud Tasks delivery target for desk-run execution. Separate from
 * TaperAiController (which requires a user JWT) because this is called by
 * Cloud Tasks, not a browser — protected by InternalTaskGuard instead.
 *
 * Cloud Tasks calls this synchronously and waits for the response, so the
 * full multi-stage pipeline (analysts → debate → personas → trader → risk →
 * PM, ~2-3 minutes) runs inside one tracked HTTP request instead of as a
 * fire-and-forget background promise. See DeskTaskQueueService for the full
 * rationale — this replaced an always-on-instance architecture that cost
 * ~$60-70/mo to keep a fire-and-forget continuation alive after the response
 * that spawned it had already returned.
 */
@Controller('taper-ai/desk/internal')
@UseGuards(InternalTaskGuard)
export class DeskInternalController {
  private readonly logger = new Logger(DeskInternalController.name);

  constructor(private readonly desk: DeskOrchestratorService) {}

  @Post('execute/:id')
  @HttpCode(200)
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ ok: true }> {
    // runToCompletion already catches every internal failure and persists
    // run.status = 'failed' on the row itself. We still return 200 here
    // regardless, so Cloud Tasks does NOT retry an application-level
    // failure (e.g. a bad LLM response) — retries should only happen for
    // genuine infra failures (crash before reaching that try/catch, a
    // timeout, a 5xx), which is what a non-200 response signals to Cloud
    // Tasks.
    try {
      await this.desk.runToCompletion(id);
    } catch (err: any) {
      this.logger.error(`Desk run ${id} threw outside its own error handling: ${err.message}`);
    }
    return { ok: true };
  }
}
