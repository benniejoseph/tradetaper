# TaperAI — Agentic Trading Intelligence Platform

**Product concept & implementation plan — drafted 2026-07-18**

> **Integration status (2026-07-18):** TaperAI is built as a sub-product inside the
> TradeTaper monorepo, not a separate app. Phase 1 backend scaffold is live in
> `tradetaper-backend/src/taper-ai/` — a `DeskOrchestratorService` pipeline
> (4 analysts → bull/bear debate → personas → trader → risk → PM) that reuses
> the existing `MultiModelOrchestratorService` (LLM routing/cost/cache),
> `MarketIntelligenceService` (quotes + sentiment context), JWT auth, and
> throttling. Runs persist to `taper_ai_desk_runs` (migration
> `1781000000000`). §5 below describes the original greenfield architecture;
> the actual stack is NestJS + TypeORM + Cloud SQL Postgres + Next.js
> (tradetaper-frontend). The model-routing strategy in §4 still applies — the
> multi-model orchestrator currently prefers Gemini and should get
> Claude Sonnet/Haiku tiers enabled per §4.

---

## 1. The Idea, Sharpened

The raw trend: "Agentic Trading" — LLM agents that analyze sentiment and act on markets. The trap in that trend: fully autonomous money-moving bots are (a) a regulatory minefield for an indie product, (b) unprofitable once slippage and fees eat simulated alpha, and (c) a commodity — Robinhood, Webull, Public, and SoFi already shipped agentic trading in 2026.

**The sharpened positioning: don't sell the trade — sell the desk.**

TaperAI is an **AI research desk for retail traders**: a multi-agent "trading firm in a box" that debates every ticker you care about, watches sentiment 24/7, and produces conviction-scored, explainable trade theses. The human stays on the trigger. Execution (via broker APIs, human-confirmed) comes later as a premium tier — not the core product.

Why this framing wins:

- **Explainability is the product.** Watching a Buffett agent argue with a Burry agent about your position is genuinely differentiated UX. A silent bot that returns "BUY" is not.
- **No license needed for research tools.** Decision-support + paper trading avoids the RIA/advice line that autonomous execution walks straight into.
- **Synergy with TradeTaper.** A trading journal already captures what users *did*. TaperAI captures what they *should consider* — and closing the loop ("the desk flagged X, you did Y, here's the delta") is a moat neither a bot nor a journal has alone.
- **Honest economics.** The research above confirms live returns lag backtests badly (slippage, costs, regime change). A research tool doesn't have to beat the market to be worth $30/mo — it has to save hours and improve process.

## 2. Market Landscape (July 2026)

| Player | What they do | Gap we exploit |
|---|---|---|
| Robinhood / Webull agentic trading | Connect external AI (Claude/ChatGPT) to your account | Execution rails, no research depth — we're complementary, not competitive |
| Public / SoFi | In-app rules-based AI strategies | Closed, no persona debate, no explainability |
| Alphio, AInvest, Tritonix | NL trading / screening / smart-money tracking | Single-agent chat UX; no adversarial multi-agent debate, no journal loop |
| Horizon.Trade | Plain-English strategy → backtest → deploy | Strategy automation, not thesis research |
| ai-hedge-fund (virattt, 59k★) | Open-source persona agents (Buffett, Burry, Wood…) | It's a repo, not a product — validates demand, ships no UX, no live monitoring, no mobile |
| TradingAgents (Tauric) | Open-source multi-agent firm simulation (LangGraph) | Same: research framework, not a consumer product |

**Key insight:** the two most-loved projects in this space (ai-hedge-fund, TradingAgents) have ~80k combined GitHub stars and zero consumer product wrapped around them. The demand signal is enormous; the productization is the open lane.

## 3. Product Concept

### Core loop
1. User builds a **watchlist** (stocks + crypto).
2. The **Desk** (multi-agent pipeline) runs on demand and on schedule (pre-market, post-earnings, on sentiment spikes).
3. Output: a **Thesis Card** per ticker — direction, conviction score, time horizon, the bull/bear debate transcript, risk manager's position-size note, and the dissenting opinions.
4. User acts (or doesn't) in their own broker; optionally logs it to TradeTaper.
5. **Scorecard** tracks every thesis vs. what actually happened — the desk's own track record is public inside the app. Radical honesty as a feature.

### The Desk (agent roster, v1)
Modeled on TradingAgents' firm structure + ai-hedge-fund's personas, trimmed to what's affordable:

- **4 Analysts** (parallel): Fundamentals, Technicals, News, Sentiment
- **2 Researchers** (adversarial debate, 2–3 rounds): Bull vs. Bear
- **Persona layer** (user picks 2–3 per run): Buffett (moats/value), Burry (contrarian/short), Wood (disruption/growth), Lynch (growth-at-reasonable-price), Taleb (tail risk)
- **Trader**: synthesizes into a thesis + entry/exit levels
- **Risk Manager**: position sizing, invalidation level, "what kills this thesis"
- **Portfolio Manager**: approves/rejects vs. the user's existing positions and risk profile

### Sentiment Radar (the 24/7 piece)
Continuous ingestion of news + Reddit (+ X if budget allows) per watchlist ticker. Cheap classifier scores every item; a "vibe shift" detector (rolling z-score on sentiment velocity) triggers push notifications and can auto-queue a Desk run. This is the retention hook — the reason to keep the app installed.

### Paper Trading & Backtesting
- Every thesis can be one-tap "paper traded"; the app tracks P&L including **modeled slippage and fees** (differentiator: we show the haircut everyone else hides).
- Backtest mode: run the Desk against historical dates ("what would the desk have said on 2025-01-15?") with point-in-time data to avoid lookahead bias.

### Explicit non-goals (v1)
- No autonomous execution. No custody. No personalized financial advice ("the desk's opinion on the ticker," not "you should buy"). Prominent disclaimers; this is a research/education tool.

## 4. AI Model Strategy (the "which model" answer)

No single model — a **tiered routing strategy**, because the workload splits into high-volume/cheap and low-volume/deep:

| Tier | Job | Model | Why |
|---|---|---|---|
| T1 — Firehose | Score 10k+ news/Reddit items/day for sentiment | **Claude Haiku 4.5** (or fine-tuned FinBERT locally for near-zero cost) | Classification doesn't need reasoning; cost dominates. Haiku for nuance, FinBERT/DistilBERT for bulk pre-filter |
| T2 — Analysts & debate | The 4 analysts, bull/bear researchers, personas | **Claude Sonnet 5** | Best cost/quality for multi-step reasoning over documents; 2026 benchmarks put Claude at the top for narrative accuracy & multi-doc financial analysis |
| T3 — Final synthesis | Trader + Risk + PM verdict (1 call chain per run) | **Claude Fable 5 / Opus-class** | The verdict is what users pay for; worth the premium on ~3 calls per run |
| Numeric truth | Ratios, indicators, P&L, backtests | **Deterministic Python — never the LLM** | 2026 Daloopa benchmark: LLM native numeric calc ≈ 52% accuracy. All math in code; LLMs interpret, never compute |
| Optional | Real-time X/Twitter pulse | Grok API | Only if X sentiment proves necessary — it has unique real-time X access; expensive |

Implementation notes:
- Build on **Claude Agent SDK** (TypeScript) for the orchestration — tool use, parallel subagents, and structured outputs map 1:1 onto the Desk design. Use **TradingAgents (LangGraph/Python)** as a reference architecture and prompt mine, not a dependency.
- **Prompt caching** is critical: analyst system prompts + shared ticker context are identical across the 8+ calls in one Desk run → 60–80% input-token savings.
- Batch API for scheduled overnight runs (50% off).
- **FinRL is out of scope** for the product (RL policies are uninterpretable — opposite of our value prop) but noted as a future "quant agent" persona.

### Cost model per Desk run (rough)
~8–12 LLM calls: ~10 Sonnet calls (~30k in / 8k out with caching) + 3 Fable/Opus calls ≈ **$0.15–0.40/run**. At 20 runs/user/mo → COGS ~$3–8/user → healthy margin at $19–39/mo. Sentiment firehose with FinBERT pre-filter + Haiku on the ambiguous 10% ≈ pennies/user/day.

## 5. Architecture

```
┌─ Next.js app (Vercel) ── UI: Thesis Cards, Radar, Scorecard, watchlists
│        │
├─ API routes / tRPC ──── auth (Clerk/Auth.js), billing (Stripe)
│        │
├─ Agent service (Node, Claude Agent SDK) ── Desk orchestration,
│        │                                    runs on Cloud Run jobs
├─ Ingestion workers (Cloud Run + Scheduler) ─ news/Reddit pollers,
│        │                                      FinBERT scorer (small GPU-free container)
├─ Neon Postgres + Drizzle ── users, watchlists, theses, sentiment
│                              time-series (pg_partman), scorecard
├─ Market data: Financial Datasets API or Polygon.io (fundamentals,
│               prices, point-in-time for backtests); Alpaca (free
│               paper-trading sandbox)
└─ Push: FCM/APNs via the (later) Expo app; email digests (Resend)
```

Stack matches the existing Doreish toolkit (Next.js, Neon, Drizzle, Cloud Run, Vercel) — no new infra to learn.

## 6. Implementation Plan

### Phase 0 — Validate (Week 1–2)
- Clone ai-hedge-fund + TradingAgents locally; run both on 10 tickers; harvest what works in their prompts/debate mechanics.
- Spike: one end-to-end "Desk run" as a single Claude Agent SDK script → JSON Thesis Card. Measure cost & latency for real.
- Landing page + waitlist (position: "Your personal AI research desk — Buffett and Burry argue about your watchlist"). Post to r/algotrading, X. **Gate: 200+ waitlist signups or pivot the positioning.**

### Phase 1 — MVP: The Desk (Week 3–8)
- Next.js app: auth, watchlist CRUD, "Run the Desk" button, Thesis Card UI (debate transcript is the hero screen), run history.
- Agent service: 4 analysts + bull/bear debate + trader/risk/PM chain; 3 personas (Buffett, Burry, Wood); prompt caching + structured outputs.
- Market data integration (Financial Datasets API); all indicators/ratios computed in code.
- Paper-trade logging with slippage/fee model; basic scorecard.
- Ship to waitlist as free beta. **Gate: ≥30% of beta users run the Desk 3+ times in week one.**

### Phase 2 — Sentiment Radar (Week 9–14)
- Ingestion workers: RSS/news API + Reddit (praw) per ticker; FinBERT pre-filter → Haiku scoring; sentiment time-series + z-score spike detection.
- Radar UI (per-ticker vibe timeline) + email/push alerts; spikes auto-queue Desk runs.
- Historical backtest mode ("desk time machine") with point-in-time data.
- Stripe: Free (3 runs/mo, 1 ticker radar) / Pro $29/mo (60 runs, 10 tickers, alerts) / Desk+ $79/mo (unlimited-ish, all personas, backtests).

### Phase 3 — Close the loop (Week 15–20)
- TradeTaper integration: import executed trades, "thesis vs. behavior" analytics.
- Public desk scorecard (marketing weapon: transparent accuracy stats).
- Expo mobile app (radar alerts are inherently mobile).
- Community: shareable Thesis Cards (built-in viral loop — "look what the desk said about NVDA").

### Phase 4 — Execution tier (only if pulled by users; Month 6+)
- Broker connect via Alpaca/SnapTrade: **one-tap human-confirmed order** from a Thesis Card. Never auto-fire. Revisit legal review (jurisdiction-dependent) before shipping.

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM theses are confidently wrong | Public scorecard, conviction calibration, "what invalidates this" mandatory field, disclaimers everywhere |
| Data costs balloon | Start with Financial Datasets API (~$29–99/mo tiers); Reddit free tier; defer X API |
| Regulatory (investment advice) | Research/education framing, no personalization of advice, no execution in v1; legal review before Phase 4 |
| Big brokers add debate UX | Speed + niche depth + journal loop; brokers won't publish an honest scorecard |
| Model costs at scale | Routing tiers, caching, batch API; FinBERT absorbs the firehose |

## 8. Sources

- TradingAgents: [paper](https://arxiv.org/abs/2412.20138) · [repo](https://github.com/tauricresearch/tradingagents) · [site](https://tradingagents-ai.github.io/)
- ai-hedge-fund: [repo](https://github.com/virattt/ai-hedge-fund) · [18-agent breakdown](https://converter.brightcoding.dev/blog/ai-hedge-fund-18-agents-that-think-like-legendary-traders)
- FinRL: [repo](https://github.com/AI4Finance-Foundation/FinRL) · [FinRL-X paper](https://arxiv.org/html/2603.21330v1)
- Market/LLM landscape: [Best LLMs for financial analysis 2026](https://www.azilen.com/learning/best-llms-for-financial-analysis/) · [LLMs for stock trading 2026](https://visionvix.com/best-llm-for-stock-trading/) · [Agentic trading platforms comparison](https://intellectia.ai/blog/ai-trading-agent-platforms-2026-comparison) · [Broker agentic trading](https://www.finder.com/stock-trading/best-agentic-trading-platforms) · [AI trading agents review](https://pinggy.io/blog/best_ai_trading_agents/)
