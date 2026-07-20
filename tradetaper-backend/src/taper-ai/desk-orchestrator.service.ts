// src/taper-ai/desk-orchestrator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeskRun } from './entities/desk-run.entity';
import {
  MultiModelOrchestratorService,
  LLMResponse,
} from '../agents/llm/multi-model-orchestrator.service';
import { TaperAiMarketDataService } from './market-data.service';
import {
  ANALYST_PROMPTS,
  BULL_PROMPT,
  BEAR_PROMPT,
  BULL_REBUTTAL_PROMPT,
  PERSONA_PROMPTS,
  TRADER_PROMPT,
  RISK_PROMPT,
  PM_PROMPT,
} from './prompts/desk-prompts';

/**
 * Desk Orchestrator — runs the TaperAI multi-agent research pipeline:
 *
 *   context → 4 analysts (parallel) → bull/bear debate (2.5 rounds)
 *           → persona opinions (parallel) → trader → risk → PM verdict
 *
 * Every stage is persisted on the DeskRun so the frontend can render the
 * full debate transcript. Runs execute async in-process for v1; move to a
 * BullMQ queue when volume justifies it (see PRODUCT_PLAN.md Phase 2).
 */
@Injectable()
export class DeskOrchestratorService {
  private readonly logger = new Logger(DeskOrchestratorService.name);

  constructor(
    @InjectRepository(DeskRun)
    private readonly deskRunRepo: Repository<DeskRun>,
    private readonly llm: MultiModelOrchestratorService,
    private readonly marketData: TaperAiMarketDataService,
  ) {}

  /** Kick off a run without blocking the request. */
  async startRun(run: DeskRun): Promise<void> {
    // Deliberately not awaited by the controller; errors are captured on the run.
    this.execute(run.id).catch((err) => {
      this.logger.error(`Desk run ${run.id} crashed: ${err.message}`);
    });
  }

  private async execute(runId: string): Promise<void> {
    const run = await this.deskRunRepo.findOneByOrFail({ id: runId });
    const startedAt = Date.now();
    let totalTokens = 0;
    let totalCostUsd = 0;

    const track = (res: LLMResponse) => {
      totalTokens += res.metadata.totalTokens || 0;
      totalCostUsd += res.metadata.cost || 0;
      return res;
    };

    try {
      run.status = 'running';
      await this.deskRunRepo.save(run);

      // ---- Context ------------------------------------------------------
      const context = await this.gatherContext(run.symbol);
      const contextBlock = `INSTRUMENT: ${run.symbol}\nDATE: ${new Date().toISOString().slice(0, 10)}\n\nMARKET CONTEXT:\n${context}`;

      // ---- Stage 1: analysts in parallel --------------------------------
      const analystEntries = await Promise.all(
        Object.entries(ANALYST_PROMPTS).map(async ([role, system]) => {
          const res = track(
            await this.llm.complete({
              system,
              prompt: contextBlock,
              taskComplexity: 'medium',
              optimizeFor: 'quality',
              requireJson: true,
              maxTokens: 1024,
              userId: run.userId,
            }),
          );
          return [role, this.parseJson(res.content, role)] as const;
        }),
      );
      const analysts = Object.fromEntries(analystEntries);

      // ---- Stage 2: bull/bear debate ------------------------------------
      const reportsBlock = `${contextBlock}\n\nANALYST REPORTS:\n${JSON.stringify(analysts, null, 2)}`;

      const bull = this.parseJson(
        track(
          await this.llm.complete({
            system: BULL_PROMPT,
            prompt: reportsBlock,
            taskComplexity: 'medium',
            optimizeFor: 'quality',
            requireJson: true,
            maxTokens: 1024,
            userId: run.userId,
          }),
        ).content,
        'bull',
      );

      const bear = this.parseJson(
        track(
          await this.llm.complete({
            system: BEAR_PROMPT,
            prompt: `${reportsBlock}\n\nBULL ARGUMENT:\n${JSON.stringify(bull)}`,
            taskComplexity: 'medium',
            optimizeFor: 'quality',
            requireJson: true,
            maxTokens: 1024,
            userId: run.userId,
          }),
        ).content,
        'bear',
      );

      const bullRebuttal = this.parseJson(
        track(
          await this.llm.complete({
            system: BULL_REBUTTAL_PROMPT,
            prompt: `${reportsBlock}\n\nBULL ARGUMENT:\n${JSON.stringify(bull)}\n\nBEAR REBUTTAL:\n${JSON.stringify(bear)}`,
            taskComplexity: 'medium',
            optimizeFor: 'quality',
            requireJson: true,
            maxTokens: 1024,
            userId: run.userId,
          }),
        ).content,
        'bull-rebuttal',
      );

      const debate = [bull, bear, bullRebuttal];

      // ---- Stage 3: persona opinions in parallel ------------------------
      const requested = run.personas?.length
        ? run.personas
        : Object.keys(PERSONA_PROMPTS);
      const personaEntries = await Promise.all(
        requested
          .filter((p) => PERSONA_PROMPTS[p])
          .map(async (p) => {
            const res = track(
              await this.llm.complete({
                system: PERSONA_PROMPTS[p].prompt,
                prompt: `${reportsBlock}\n\nDEBATE:\n${JSON.stringify(debate)}`,
                taskComplexity: 'medium',
                optimizeFor: 'quality',
                requireJson: true,
                maxTokens: 768,
                userId: run.userId,
              }),
            );
            return [p, this.parseJson(res.content, `persona-${p}`)] as const;
          }),
      );
      const personaOpinions = Object.fromEntries(personaEntries);

      // ---- Stage 4: trader → risk → PM ----------------------------------
      const fullDossier = `${reportsBlock}\n\nDEBATE:\n${JSON.stringify(debate, null, 2)}\n\nPERSONA OPINIONS:\n${JSON.stringify(personaOpinions, null, 2)}`;

      const trader = this.parseJson(
        track(
          await this.llm.complete({
            system: TRADER_PROMPT,
            prompt: fullDossier,
            taskComplexity: 'complex',
            optimizeFor: 'quality',
            requireJson: true,
            maxTokens: 1024,
            userId: run.userId,
          }),
        ).content,
        'trader',
      );

      const risk = this.parseJson(
        track(
          await this.llm.complete({
            system: RISK_PROMPT,
            prompt: `${fullDossier}\n\nTRADER THESIS:\n${JSON.stringify(trader)}`,
            taskComplexity: 'complex',
            optimizeFor: 'quality',
            requireJson: true,
            maxTokens: 768,
            userId: run.userId,
          }),
        ).content,
        'risk',
      );

      const pm = this.parseJson(
        track(
          await this.llm.complete({
            system: PM_PROMPT,
            prompt: `${fullDossier}\n\nTRADER THESIS:\n${JSON.stringify(trader)}\n\nRISK REVIEW:\n${JSON.stringify(risk)}`,
            taskComplexity: 'complex',
            optimizeFor: 'quality',
            requireJson: true,
            maxTokens: 768,
            userId: run.userId,
          }),
        ).content,
        'pm',
      );

      // ---- Persist ------------------------------------------------------
      run.stages = {
        context,
        analysts,
        debate,
        personaOpinions,
        trader,
        risk,
        pm,
      };
      run.verdict = {
        direction: pm.finalDirection ?? trader.direction ?? 'neutral',
        conviction: this.clampConviction(
          pm.finalConviction ?? risk.adjustedConviction ?? trader.conviction,
        ),
        horizon: trader.horizon ?? 'unspecified',
        thesis: pm.summary ?? trader.thesis ?? '',
        entry: trader.entryZone,
        exit: trader.exitTarget,
        invalidation: trader.invalidation ?? '',
        dissent: trader.dissent,
      };
      run.direction = run.verdict.direction;
      run.conviction = run.verdict.conviction;
      run.status = 'completed';
      run.completedAt = new Date();
      run.totalTokens = totalTokens;
      run.totalCostUsd = totalCostUsd;
      run.durationMs = Date.now() - startedAt;
      await this.deskRunRepo.save(run);

      this.logger.log(
        `Desk run ${run.id} (${run.symbol}) completed: ${run.direction} ` +
          `conviction=${run.conviction} tokens=${totalTokens} cost=$${totalCostUsd.toFixed(4)}`,
      );
    } catch (err: any) {
      run.status = 'failed';
      run.error = err.message ?? String(err);
      run.totalTokens = totalTokens;
      run.totalCostUsd = totalCostUsd;
      run.durationMs = Date.now() - startedAt;
      await this.deskRunRepo.save(run);
      this.logger.error(`Desk run ${run.id} failed: ${run.error}`);
    }
  }

  /**
   * Assemble market context. Real quotes, history, and programmatically
   * computed indicators — the LLM never computes, only interprets.
   */
  private async gatherContext(symbol: string): Promise<string> {
    return this.marketData.buildContext(symbol);
  }

  /** Strip accidental markdown fences and parse agent JSON defensively. */
  private parseJson(content: string, stage: string): any {
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          /* fall through */
        }
      }
      this.logger.warn(`Stage ${stage}: non-JSON output, storing raw text`);
      return { parseError: true, raw: content };
    }
  }

  private clampConviction(value: any): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }
}
