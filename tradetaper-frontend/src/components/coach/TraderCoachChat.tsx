'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { authApiClient } from '@/services/api';
import ReactMarkdown from 'react-markdown';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  structured?: CoachStructuredResponse;
};

type CoachMetric = {
  label: string;
  value: string;
  context?: string;
};

type CoachDiagnosis = {
  title: string;
  severity: 'high' | 'medium' | 'low';
  finding: string;
  impact: string;
  action: string;
  evidenceRefs: string[];
};

type CoachPattern = {
  pattern: string;
  whyItMatters: string;
  trigger: string;
  intervention: string;
  evidenceRefs: string[];
};

type CoachPlanStep = {
  step: string;
  objective: string;
  checklist: string[];
  whenToApply: string;
};

type CoachRiskAlert = {
  title: string;
  level: 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
};

type CoachEvidence = {
  evidenceId: string;
  tradeId: string;
  symbol: string;
  openTime: string;
  pnl: number;
  rMultiple: number;
  ruleViolations: number;
  emotionBefore?: string | null;
  emotionAfter?: string | null;
  accountName?: string | null;
  note: string;
};

type CoachStructuredResponse = {
  headline: string;
  diagnosis: CoachDiagnosis[];
  performance: {
    overview: string;
    keyMetrics: CoachMetric[];
  };
  psychologyPatterns: CoachPattern[];
  next5TradesPlan: CoachPlanStep[];
  riskAlerts: CoachRiskAlert[];
  evidence: CoachEvidence[];
  confidence: number;
  missingData: string[];
};

type CoachContext = {
  accountId?: string | null;
  totalTrades?: number;
  closedTrades?: number;
  openTrades?: number;
  netPnL?: number;
  detailedRecordsProvided?: number;
  recordsAnalyzed?: number;
};

type CoachApiResponse = {
  success: boolean;
  data?: {
    answer?: string;
    context?: CoachContext;
    structured?: CoachStructuredResponse;
  };
  error?: {
    message?: string;
  };
};

export default function TraderCoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'I am your Expert Trader + Trading Psychology Coach. Ask me anything about your performance, mistakes, discipline, risk habits, or account-by-account behavior.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scopeToSelectedAccount, setScopeToSelectedAccount] = useState(false);
  const [lastContext, setLastContext] = useState<CoachContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedAccountId = useSelector(
    (state: RootState) => state.accounts.selectedAccountId,
  );
  const selectedMT5AccountId = useSelector(
    (state: RootState) => state.mt5Accounts.selectedAccountId,
  );
  const regularAccounts = useSelector((state: RootState) => state.accounts.accounts);
  const mt5Accounts = useSelector((state: RootState) => state.mt5Accounts.accounts);

  const activeAccountId = selectedAccountId || selectedMT5AccountId || null;

  const activeAccountLabel = useMemo(() => {
    if (!activeAccountId) {
      return 'All accounts';
    }
    const regular = regularAccounts.find((item) => item.id === activeAccountId);
    if (regular) {
      return regular.name;
    }
    const mt5 = mt5Accounts.find((item) => item.id === activeAccountId);
    if (mt5) {
      return mt5.accountName;
    }
    return 'Selected account';
  }, [activeAccountId, regularAccounts, mt5Accounts]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async (forcedMessage?: string) => {
    const messageText = (forcedMessage ?? input).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
    };

    const historyPayload = messages
      .slice(-10)
      .filter((msg) => msg.id !== 'welcome')
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApiClient.post<CoachApiResponse>(
        '/agents/coach/chat',
        {
          message: messageText,
          accountId:
            scopeToSelectedAccount && activeAccountId ? activeAccountId : undefined,
          history: historyPayload,
        },
      );

      const payload = response.data;
      const reply =
        payload?.data?.answer?.trim() ||
        payload?.error?.message ||
        'I could not generate a coaching response right now.';
      const structured = payload?.data?.structured;

      setLastContext(payload?.data?.context || null);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: reply,
          structured,
        },
      ]);
    } catch (requestError: unknown) {
      const message =
        (requestError as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to reach AI Coach. Please try again.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `I hit an error while processing your request: ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze my top 3 discipline mistakes from recent trades.',
    'Which account is performing best and why?',
    'Give me a 5-trade improvement plan based on my psychology patterns.',
    'Where am I leaking risk based on win/loss behavior?',
  ];

  const latestStructured = useMemo(() => {
    const reversed = [...messages].reverse();
    for (const message of reversed) {
      if (message.role === 'assistant' && message.structured) {
        return message.structured;
      }
    }
    return null;
  }, [messages]);

  const severityClass = (severity: 'high' | 'medium' | 'low') => {
    if (severity === 'high') return 'border-red-500/30 bg-red-500/10 text-red-300';
    if (severity === 'medium')
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[620px] flex-col overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 bg-emerald-950/20 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/15">
            <Bot className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">AI Trader Coach</p>
            <p className="text-xs text-zinc-400">
              Expert trader + psychology persona with account-aware insights
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
            Scope: {scopeToSelectedAccount && activeAccountId ? activeAccountLabel : 'All accounts'}
          </span>
          <label className="flex items-center gap-2 text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
              checked={scopeToSelectedAccount}
              onChange={(event) => setScopeToSelectedAccount(event.target.checked)}
              disabled={!activeAccountId}
            />
            Use selected account
          </label>
        </div>
      </div>

      <div className="grid flex-1 gap-4 overflow-hidden px-5 py-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          className="space-y-4 overflow-y-auto pr-1"
        >
          <div className="grid gap-2 md:grid-cols-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="rounded-xl border border-emerald-500/20 bg-zinc-900/60 p-3 text-left text-xs text-zinc-300 transition hover:border-emerald-500/40 hover:bg-zinc-900"
              >
                {prompt}
              </button>
            ))}
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[94%] rounded-2xl border px-4 py-3 md:max-w-[88%] ${
                  message.role === 'user'
                    ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-50'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-400">
                  {message.role === 'user' ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                  <span>{message.role === 'user' ? 'You' : 'Coach'}</span>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-6">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating insights from your trade history...
            </div>
          )}
        </div>

        <div className="space-y-3 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-300">Coach Brief</h3>
            {latestStructured && (
              <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300">
                Confidence {Math.round(latestStructured.confidence)}%
              </span>
            )}
          </div>

          {!latestStructured ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
              Ask a question to generate structured diagnosis, behavior patterns, and an actionable next-5-trades plan.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-sm font-semibold text-emerald-200">
                  {latestStructured.headline}
                </p>
              </div>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Immediate Diagnosis
                </p>
                {latestStructured.diagnosis.map((item) => (
                  <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">{item.finding}</p>
                    <p className="mt-1 text-xs text-zinc-400">Action: {item.action}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Performance
                </p>
                <p className="text-xs text-zinc-300">{latestStructured.performance.overview}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {latestStructured.performance.keyMetrics.map((metric) => (
                    <div key={`${metric.label}-${metric.value}`} className="rounded-lg border border-zinc-800 bg-black/40 p-2.5">
                      <p className="text-[11px] text-zinc-400">{metric.label}</p>
                      <p className="text-sm font-semibold text-zinc-100">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Next 5 Trades Plan
                </p>
                {latestStructured.next5TradesPlan.map((step, index) => (
                  <div key={`${step.step}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-sm font-semibold text-emerald-200">
                      {index + 1}. {step.objective}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{step.whenToApply}</p>
                    <p className="mt-1 text-xs text-zinc-300">{step.checklist.join(' • ')}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Psychology Patterns
                </p>
                {latestStructured.psychologyPatterns.map((pattern) => (
                  <div key={pattern.pattern} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="text-sm font-semibold text-zinc-100">{pattern.pattern}</p>
                    <p className="mt-1 text-xs text-zinc-300">Trigger: {pattern.trigger}</p>
                    <p className="mt-1 text-xs text-zinc-400">{pattern.intervention}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Risk Alerts
                </p>
                {latestStructured.riskAlerts.map((alert) => (
                  <div key={alert.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-100">{alert.title}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass(alert.level)}`}>
                        {alert.level}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">{alert.description}</p>
                    <p className="mt-1 text-xs text-zinc-400">Mitigation: {alert.mitigation}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Evidence
                </p>
                <div className="space-y-2">
                  {latestStructured.evidence.slice(0, 6).map((evidence) => (
                    <div key={evidence.evidenceId} className="rounded-lg border border-zinc-800 bg-black/40 p-2.5">
                      <p className="text-xs font-semibold text-zinc-200">
                        {evidence.evidenceId} • {evidence.symbol}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        PnL {evidence.pnl.toFixed(2)} | R {evidence.rMultiple.toFixed(2)} | Violations {evidence.ruleViolations}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">{evidence.note}</p>
                    </div>
                  ))}
                </div>
              </section>

              {latestStructured.missingData.length > 0 && (
                <section className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Data Gaps
                  </p>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    {latestStructured.missingData.map((item) => (
                      <p key={item} className="text-xs text-amber-100">
                        • {item}
                      </p>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-800 bg-black/50 px-5 py-4">
        {lastContext && (
          <div className="mb-3 rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400">
            Trades analyzed: {lastContext.recordsAnalyzed ?? 0} | Closed:{' '}
            {lastContext.closedTrades ?? 0} | Open: {lastContext.openTrades ?? 0} |
            Net PnL: {lastContext.netPnL ?? 0}
          </div>
        )}

        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for execution feedback, psychology patterns, account comparisons, or a step-by-step improvement plan..."
            rows={3}
            className="min-h-[84px] flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/60"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
