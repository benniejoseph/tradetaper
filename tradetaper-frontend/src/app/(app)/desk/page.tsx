'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaBuildingColumns, FaPlay, FaSpinner, FaClockRotateLeft } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { taperAiService } from '@/services/taperAiService';
import { DeskRun, DeskPersona, PERSONA_LABELS } from '@/types/taperai';
import ThesisCard from '@/components/desk/ThesisCard';
import DeskAnalytics from '@/components/desk/DeskAnalytics';
import HorizonPanel from '@/components/desk/HorizonPanel';
import ICTPanel from '@/components/desk/ICTPanel';
import NewsPanel from '@/components/desk/NewsPanel';
import DebateTranscript from '@/components/desk/DebateTranscript';

const ALL_PERSONAS: DeskPersona[] = ['buffett', 'burry', 'wood'];
const POLL_INTERVAL_MS = 4000;

export default function DeskPage() {
  const [symbol, setSymbol] = useState('');
  const [personas, setPersonas] = useState<DeskPersona[]>([...ALL_PERSONAS]);
  const [runs, setRuns] = useState<DeskRun[]>([]);
  const [selected, setSelected] = useState<DeskRun | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      setRuns(await taperAiService.listRuns());
    } catch {
      /* first load may race auth hydration; history simply stays empty */
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Poll the selected run while it's in flight
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selected || (selected.status !== 'pending' && selected.status !== 'running')) {
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await taperAiService.getRun(selected.id);
        setSelected(fresh);
        if (fresh.status === 'completed' || fresh.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          loadRuns();
          if (fresh.status === 'completed') toast.success(`Desk run for ${fresh.symbol} complete`);
          if (fresh.status === 'failed') toast.error(`Desk run failed: ${fresh.error ?? 'unknown error'}`);
        }
      } catch {
        /* transient poll failure; next tick retries */
      }
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selected, loadRuns]);

  const togglePersona = (p: DeskPersona) => {
    setPersonas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const startRun = async () => {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Enter a symbol first');
      return;
    }
    setStarting(true);
    try {
      const run = await taperAiService.createRun(trimmed, personas);
      setSelected(run);
      setRuns((prev) => [run, ...prev]);
      toast(`The desk is on it — analyzing ${trimmed}`, { icon: '🏦' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start run');
    } finally {
      setStarting(false);
    }
  };

  const openRun = async (id: string) => {
    try {
      setSelected(await taperAiService.getRun(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load run');
    }
  };

  const inFlight = selected && (selected.status === 'pending' || selected.status === 'running');

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black p-2 sm:p-4 lg:p-6 overflow-auto">
      <div className="w-full flex-1 flex flex-col max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <FaBuildingColumns className="inline-block mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
            The Desk
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Your AI research desk: analysts report, bulls and bears debate, personas weigh in,
            and the desk delivers a conviction-scored thesis. Research, not advice.
          </p>
        </div>

        {/* Run form */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !starting && startRun()}
              placeholder="Symbol — e.g. AAPL, BTCUSD, EURUSD"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={startRun}
              disabled={starting || !!inFlight}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {starting || inFlight ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPlay />
              )}
              {inFlight ? 'Desk is working…' : 'Run the Desk'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_PERSONAS.map((p) => {
              const active = personas.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePersona(p)}
                  title={PERSONA_LABELS[p].blurb}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {PERSONA_LABELS[p].name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected run */}
        {selected && (
          <div className="mb-6 space-y-4">
            {inFlight && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 text-center">
                <FaSpinner className="animate-spin text-3xl text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  The desk is researching {selected.symbol} — analysts, debate, personas, risk…
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This usually takes 1–3 minutes.
                </p>
              </div>
            )}
            {selected.status === 'failed' && (
              <div className="rounded-2xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-5">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Run failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{selected.error}</p>
              </div>
            )}
            {selected.status === 'completed' && (
              <>
                <ThesisCard run={selected} />
                <HorizonPanel run={selected} />
                <ICTPanel run={selected} />
                <DeskAnalytics run={selected} />
                <NewsPanel run={selected} />
                {selected.stages && <DebateTranscript stages={selected.stages} />}
              </>
            )}
          </div>
        )}

        {/* History */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 sm:p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
            <FaClockRotateLeft className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
            Run history
          </h3>
          {runs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No desk runs yet. Give the desk its first assignment above.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-900">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => openRun(run.id)}
                  className="w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-900/60 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {run.symbol}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        run.direction === 'long'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : run.direction === 'short'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {run.status === 'completed' ? (run.direction ?? 'neutral') : run.status}
                    </span>
                    {typeof run.conviction === 'number' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        conviction {run.conviction}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {new Date(run.createdAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
