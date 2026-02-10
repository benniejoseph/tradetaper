'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaPlay, FaTrash, FaDownload } from 'react-icons/fa';

interface ReplaySession {
  id: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  startingBalance: number;
  endingBalance: number;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: string;
}

export default function ReplaySessionsPage() {
  const [sessions, setSessions] = useState<ReplaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/backtesting/sessions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const response = await fetch(`/api/v1/backtesting/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      console.error('Error deleting session:', err);
      alert('Failed to delete session');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent"></div>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/backtesting"
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <FaChevronLeft />
          </Link>
          <div>
            <h1 className="font-bold text-lg text-white">Replay Sessions</h1>
            <p className="text-xs text-slate-500">View and manage your backtesting replays</p>
          </div>
        </div>

        <Link
          href="/backtesting"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors flex items-center gap-2"
        >
          <FaPlay />
          <span>New Session</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="p-6 relative z-10">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading sessions...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-400 text-center">{error}</p>
            <button
              onClick={fetchSessions}
              className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="text-center py-20">
            <div className="text-slate-400 mb-4">
              <FaPlay className="mx-auto text-6xl opacity-20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No replay sessions yet</h2>
            <p className="text-slate-400 mb-6">Start a new replay session to practice your trading skills</p>
            <Link
              href="/backtesting"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors"
            >
              <FaPlay />
              <span>Start New Session</span>
            </Link>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="grid gap-4 max-w-6xl mx-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-900/50 border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{session.symbol}</h3>
                      <span className="text-sm text-slate-400">{session.timeframe}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          session.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : session.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {session.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mb-4">
                      {formatDate(session.startDate)} - {formatDate(session.endDate)}
                    </p>

                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-slate-500">Starting Balance</div>
                        <div className="text-sm font-mono text-white">
                          {formatCurrency(session.startingBalance)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">Ending Balance</div>
                        <div className="text-sm font-mono text-white">
                          {session.endingBalance
                            ? formatCurrency(session.endingBalance)
                            : '-'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">Total P&L</div>
                        <div
                          className={`text-sm font-mono font-bold ${
                            (session.totalPnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {session.totalPnl
                            ? (session.totalPnl >= 0 ? '+' : '') + formatCurrency(session.totalPnl)
                            : '-'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">Trades</div>
                        <div className="text-sm font-mono text-white">
                          {session.totalTrades || 0} ({session.winningTrades || 0}W /{' '}
                          {session.losingTrades || 0}L)
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">Win Rate</div>
                        <div
                          className={`text-sm font-mono font-bold ${
                            (session.winRate || 0) >= 50 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {session.winRate ? session.winRate.toFixed(1) + '%' : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-6">
                    <Link
                      href={`/backtesting/session/${session.id}?symbol=${session.symbol}&timeframe=${session.timeframe}&startDate=${session.startDate}&endDate=${session.endDate}&balance=${session.startingBalance}`}
                      className="p-2 hover:bg-white/5 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"
                      title="Resume session"
                    >
                      <FaPlay />
                    </Link>

                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 hover:bg-white/5 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Delete session"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
