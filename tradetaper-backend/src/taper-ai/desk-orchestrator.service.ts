// src/taper-ai/desk-orchestrator.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeskRun } from './entities/desk-run.entity';
import {
  MultiModelOrchestratorService,
  LLMResponse,
} from '../agents/llm/multi-model-orchestrator.service';
import {
  TaperAiMarketDataService,
  MarketSnapshot,
} from './market-data.service';
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
 * full debate transcript.
 *
 * Execution is triggered via Cloud Tasks (DeskTaskQueueService +
 * DeskInternalController), not a fire-and-forget promise inside the request
 * that creates the run — that older pattern kept running after the HTTP
 * response returned, which only worked reliably with an always-on Cloud Run
 * instance (min-instances=1, CPU throttling disabled) costing ~$60-70/mo.
 * runToCompletion() below is awaited synchronously by DeskInternalController
 * inside a Cloud-Tasks-delivered request, so the whole pipeline runs inside
 * one tracked HTTP request/response cycle and the service can scale to zero
 * between runs.
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

  /** Synchronous entry point called by DeskInternalController — awaited fully. */
  async runToCompletion(runId: string): Promise<void> {
    return this.execute(runId);
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
      // One fetch, then ROLE-SPECIFIC views: previously every analyst got the
      // same price blob, so news/sentiment/fundamentals had nothing to analyze.
      const snapshot: MarketSnapshot = await this.marketData.buildSnapshot(
        run.symbol,
      );
      const context = this.marketData.renderFull(snapshot);
      const contextBlock = `INSTRUMENT: ${run.symbol}\nDATE: ${new Date().toISOString().slice(0, 10)}\n\nMARKET CONTEXT:\n${context}`;

      // ---- Stage 1: analysts in parallel --------------------------------
      const analystEntries = await Promise.all(
        Object.entries(ANALYST_PROMPTS).map(async ([role, system]) => {
          const res = track(
            await this.llm.complete({
              system,
              prompt: `INSTRUMENT: ${run.symbol}\n\n${this.marketData.renderForRole(snapshot, role)}`,
              taskComplexity: 'medium',
              optimizeFor: 'quality',
              requireJson: true,
              maxTokens: 1400,
              userId: run.userId,
            }),
          );
          return [role, this.parseJson(res.content, role)] as const;
        }),
      );
      const analysts = Object.fromEntries(analystEntries);
      const confluence = this.buildConfluenceScorecard(analysts);

      // ---- Stage 2: bull/bear debate ------------------------------------
      const reportsBlock =
        `${contextBlock}\n\nANALYST REPORTS:\n${JSON.stringify(analysts, null, 2)}` +
        `\n\n${this.renderConfluenceScorecard(confluence)}`;

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
            maxTokens: 2200,
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
        snapshot,
        analysts,
        confluence,
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

  // ---- confluence scorecard -----------------------------------------------
  // Deterministic cross-analyst aggregation, computed in code rather than
  // asked of the trader freehand. Previously the trader had to eyeball five
  // raw JSON blobs and synthesize agreement/conflict itself — error-prone and
  // inconsistent run to run. This gives every downstream stage (debate,
  // trader, risk, PM) the same computed starting point.

  private buildConfluenceScorecard(analysts: Record<string, any>): {
    netScore: number;
    label: string;
    votes: { role: string; stance: string; confidence: number }[];
    groups: { bullish: string[]; bearish: string[]; neutral: string[] };
    ictVsTechnical: 'agree' | 'conflict' | 'incomplete';
  } {
    const votes: { role: string; stance: string; confidence: number }[] = [];
    for (const [role, report] of Object.entries(analysts)) {
      const stance = report?.stance;
      if (stance !== 'bullish' && stance !== 'bearish' && stance !== 'neutral') continue;
      const confidence = Number(report?.confidence);
      votes.push({ role, stance, confidence: Number.isFinite(confidence) ? confidence : 50 });
    }

    const bullishWeight = votes.filter((v) => v.stance === 'bullish').reduce((s, v) => s + v.confidence, 0);
    const bearishWeight = votes.filter((v) => v.stance === 'bearish').reduce((s, v) => s + v.confidence, 0);
    const totalWeight = votes.reduce((s, v) => s + v.confidence, 0);
    const netScore = totalWeight > 0 ? Math.round(((bullishWeight - bearishWeight) / totalWeight) * 100) : 0;

    const bullishCount = votes.filter((v) => v.stance === 'bullish').length;
    const bearishCount = votes.filter((v) => v.stance === 'bearish').length;
    let label: string;
    if (Math.abs(netScore) >= 40 && Math.max(bullishCount, bearishCount) >= 3) {
      label = netScore > 0 ? 'strong bullish confluence' : 'strong bearish confluence';
    } else if (Math.abs(netScore) >= 15) {
      label = netScore > 0 ? 'lean bullish' : 'lean bearish';
    } else {
      label = 'mixed / conflicted';
    }

    const groups = {
      bullish: votes.filter((v) => v.stance === 'bullish').map((v) => v.role),
      bearish: votes.filter((v) => v.stance === 'bearish').map((v) => v.role),
      neutral: votes.filter((v) => v.stance === 'neutral').map((v) => v.role),
    };

    // ICT and classical technical are the desk's two structural/price-action
    // lenses; the trader prompt already treats their agreement as a stronger
    // signal, so surface that comparison explicitly rather than making the
    // trader re-derive it from the raw reports.
    const ictStance = analysts?.ict?.stance;
    const techStance = analysts?.technical?.stance;
    let ictVsTechnical: 'agree' | 'conflict' | 'incomplete' = 'incomplete';
    if (
      (ictStance === 'bullish' || ictStance === 'bearish') &&
      (techStance === 'bullish' || techStance === 'bearish')
    ) {
      ictVsTechnical = ictStance === techStance ? 'agree' : 'conflict';
    }

    return { netScore, label, votes, groups, ictVsTechnical };
  }

  private renderConfluenceScorecard(scorecard: ReturnType<DeskOrchestratorService['buildConfluenceScorecard']>): string {
    const { netScore, label, votes, groups, ictVsTechnical } = scorecard;
    const voteLine = votes.map((v) => `${v.role}=${v.stance}(${v.confidence})`).join(', ');
    const ictNote =
      ictVsTechnical === 'agree'
        ? 'ICT and Technical AGREE — treat this as materially stronger signal.'
        : ictVsTechnical === 'conflict'
          ? 'ICT and Technical CONFLICT — state which is driving the near-term vs longer-term view.'
          : 'ICT vs Technical comparison incomplete (one or both missing/neutral).';
    return [
      `DESK CONFLUENCE SCORECARD (computed deterministically from analyst stances/confidence — weigh alongside, not instead of, the individual reports):`,
      `  Net directional score: ${netScore > 0 ? '+' : ''}${netScore} (-100 fully bearish, +100 fully bullish) — ${label}`,
      `  Votes: ${voteLine || 'none parsed'}`,
      `  Bullish: ${groups.bullish.join(', ') || 'none'} | Bearish: ${groups.bearish.join(', ') || 'none'} | Neutral: ${groups.neutral.join(', ') || 'none'}`,
      `  ${ictNote}`,
    ].join('\n');
  }
}
