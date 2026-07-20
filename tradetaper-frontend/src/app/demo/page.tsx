import Link from 'next/link';
import { FaArrowRight, FaCheckCircle, FaPlayCircle } from 'react-icons/fa';

const DEMO_STEPS = [
  {
    title: 'Connect Accounts',
    description:
      'Attach MT5 or use manual import. TradeTaper normalizes your data and keeps execution history clean.',
  },
  {
    title: 'Review With AI',
    description:
      'Get structured insights across setup quality, risk discipline, and recurring behavioral bias.',
  },
  {
    title: 'Run Improvement Loops',
    description:
      'Backtest, replay, and compare before/after performance so every week has measurable progress.',
  },
];

const MODULES = [
  'Trade Journal Workspace',
  'AI Psychology + Pattern Review',
  'Risk and Rule Enforcement',
  'Backtesting and Replay Sessions',
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#050607] text-white selection:bg-emerald-500/30">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_40%)]" />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-10">
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12 mb-10">
          <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-4">Product Demo</p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5">
            See how TradeTaper runs your full review workflow.
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed mb-8">
            This guided tour shows how traders move from raw trade data to actionable decisions without
            spreadsheet overhead.
          </p>

          <div className="rounded-2xl border border-white/10 bg-[#0a0d10] p-6 mb-8">
            <div className="flex items-center gap-3 text-slate-200">
              <FaPlayCircle className="text-emerald-300" />
              <p className="font-medium">Interactive walkthrough preview</p>
            </div>
            <p className="text-sm text-slate-400 mt-3">
              Video/interactive embed placeholder. If you share your demo media URL, I can wire it directly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold bg-white text-black hover:bg-emerald-50 transition-colors"
            >
              Start Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 border border-white/20 text-slate-100 hover:bg-white/5 transition-colors"
            >
              View Plans
              <FaArrowRight size={11} />
            </Link>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4 md:gap-5 mb-10">
          {DEMO_STEPS.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.1em] text-emerald-300 mb-3">Step {index + 1}</p>
              <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
          <h3 className="text-2xl font-semibold mb-5">What the demo covers</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {MODULES.map((module) => (
              <div key={module} className="flex items-center gap-3 text-slate-200">
                <FaCheckCircle className="text-emerald-300 text-sm" />
                <span>{module}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
