"use client";

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { FaUserCircle, FaCrown, FaEnvelope, FaChartLine, FaServer, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { communityService } from '@/services/communityService';
import { CommunitySettings } from '@/types/community';
import { useDebounce } from '@/hooks/useDebounce';
import { usersService } from '@/services/usersService';
import { logout, updateUser } from '@/store/features/authSlice';
import {
  getUserSessions,
  logoutAllSessions,
  revokeUserSession,
  UserSession,
} from '@/services/authService';
import { authApiClient } from '@/services/api';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const plan = user?.subscription?.plan || 'free';
  const planDetails = user?.subscription?.planDetails;
  const [usage, setUsage] = useState({
    trades: {
      used: 0,
      limit: (planDetails?.limits?.trades ?? 0) as number | 'unlimited',
    },
    accounts: {
      used: 0,
      limit: (planDetails?.limits?.mt5Accounts ?? 0) as number | 'unlimited',
    },
  });

  const isPremium = plan === 'premium';
  const isEssential = plan === 'essential';
  const [communitySettings, setCommunitySettings] = useState<CommunitySettings | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'current' | 'error'>('idle');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const debouncedUsername = useDebounce(usernameDraft, 400);

  useEffect(() => {
    setUsage((prev) => ({
      trades: {
        ...prev.trades,
        limit: (planDetails?.limits?.trades ?? 0) as number | 'unlimited',
      },
      accounts: {
        ...prev.accounts,
        limit: (planDetails?.limits?.mt5Accounts ?? 0) as number | 'unlimited',
      },
    }));
  }, [planDetails?.limits?.mt5Accounts, planDetails?.limits?.trades]);

  useEffect(() => {
    if (!user) return;
    authApiClient
      .get('/subscriptions/usage')
      .then((response) => {
        const data = response.data || {};
        const tradeLimit =
          typeof data.tradeLimit === 'number'
            ? data.tradeLimit === 0
              ? 'unlimited'
              : data.tradeLimit
            : (planDetails?.limits?.trades ?? 0);
        const accountLimit =
          typeof data.accountLimit === 'number'
            ? data.accountLimit
            : (planDetails?.limits?.mt5Accounts ?? 0);

        setUsage({
          trades: {
            used: Number(data.currentPeriodTrades ?? data.trades ?? 0),
            limit: tradeLimit as number | 'unlimited',
          },
          accounts: {
            used: Number(data.accountsUsed ?? data.mt5Accounts ?? 0),
            limit: accountLimit as number | 'unlimited',
          },
        });
      })
      .catch(() => {
        // Keep fallback usage from subscription plan details when usage endpoint is unavailable.
      });
  }, [planDetails?.limits?.mt5Accounts, planDetails?.limits?.trades, user]);

  useEffect(() => {
    if (user?.username) {
      setUsernameDraft(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    if (!user) return;
    setCommunityLoading(true);
    communityService
      .getSettings()
      .then(setCommunitySettings)
      .catch(() => setCommunitySettings(null))
      .finally(() => setCommunityLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const trimmed = debouncedUsername.trim().toLowerCase();
    if (!trimmed) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-z][a-z0-9_]{2,19}$/.test(trimmed)) {
      setUsernameStatus('invalid');
      return;
    }
    if (user.username && trimmed === user.username.toLowerCase()) {
      setUsernameStatus('current');
      return;
    }
    setUsernameStatus('checking');
    usersService
      .checkUsernameAvailability(trimmed)
      .then((result: { available: boolean }) => {
        setUsernameStatus(result.available ? 'available' : 'taken');
      })
      .catch(() => setUsernameStatus('error'));
  }, [debouncedUsername, user]);

  const handleUsernameSave = async () => {
    if (!user) return;
    const trimmed = usernameDraft.trim().toLowerCase();
    if (trimmed === user.username?.toLowerCase()) {
      setUsernameStatus('current');
      return;
    }
    if (usernameStatus !== 'available' && trimmed !== user.username?.toLowerCase()) {
      return;
    }
    setUsernameSaving(true);
    setUsernameError(null);
    try {
      const updated = await usersService.updateUsername(trimmed);
      dispatch(updateUser(updated));
      setUsernameStatus('current');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setUsernameError(err?.response?.data?.message || 'Unable to update username');
    } finally {
      setUsernameSaving(false);
    }
  };

  const updateCommunitySetting = async (patch: Partial<CommunitySettings>) => {
    if (!communitySettings) return;
    const previous = communitySettings;
    const optimistic = { ...communitySettings, ...patch };
    setCommunitySettings(optimistic);
    try {
      const updated = await communityService.updateSettings(patch);
      setCommunitySettings(updated);
    } catch (_error) {
      setCommunitySettings(previous);
    }
  };

  const loadSessions = async () => {
    if (!user) return;
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const list = await getUserSessions();
      setSessions(list);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSessionsError(err?.response?.data?.message || 'Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    setSessionsError(null);
    try {
      const revoked = await revokeUserSession(sessionId);
      if (!revoked) {
        setSessionsError('Session not found.');
        return;
      }
      const revokedSession = sessions.find((session) => session.id === sessionId);
      await loadSessions();
      if (revokedSession?.isCurrent) {
        dispatch(logout());
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSessionsError(
        err?.response?.data?.message || 'Failed to revoke session',
      );
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleLogoutAllSessions = async () => {
    setLogoutAllLoading(true);
    setSessionsError(null);
    try {
      await logoutAllSessions();
      dispatch(logout());
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSessionsError(
        err?.response?.data?.message || 'Failed to log out all sessions',
      );
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <FaUserCircle className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {user?.firstName || 'Trader'} {user?.lastName}
              {isPremium && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20 flex items-center gap-1">
                  <FaCrown className="w-3 h-3" /> PREMIUM
                </span>
              )}
              {isEssential && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                  ESSENTIAL
                </span>
              )}
              {plan === 'free' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 shadow-sm">
                  FREE
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
              <FaEnvelope className="w-3 h-3" /> {user?.email}
            </p>
            {user?.username && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                @{user.username}
              </p>
            )}
          </div>
        </div>
        
        <Link 
          href="/settings"
          className="px-6 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subscription Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Current Subscription</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your plan and billing</p>
                </div>
                {plan !== 'free' ? (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                        ACTIVE
                    </span>
                ) : (
                    <Link href="/pricing" className="text-emerald-500 hover:text-emerald-400 text-sm font-bold">
                        Upgrade Now &rarr;
                    </Link>
                )}
             </div>

             <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Plan</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{plan}</span>
                            {plan !== 'free' && <FaCheckCircle className="text-emerald-500 w-5 h-5" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                           {plan === 'free' ? 'Basic features for beginners' : 
                            plan === 'essential' ? 'Advanced tools for serious traders' : 
                            'Ultimate power for professionals'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                         <Link href="/pricing" className="flex-1 py-2.5 text-center text-sm font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20">
                            {plan === 'premium' ? 'Manage Plan' : 'Upgrade Plan'}
                         </Link>
                         <Link href="/billing" className="flex-1 py-2.5 text-center text-sm font-medium rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                            Billing History
                         </Link>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Plan Features</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <FaCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                            <span>
                              {planDetails?.limits?.trades === 'unlimited'
                                ? 'Unlimited Trades/mo'
                                : `${planDetails?.limits?.trades ?? 0} Trades/mo`}
                            </span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                             <FaCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                            <span>{planDetails?.limits?.marketIntelligence === 'full' ? 'Advanced Market Intelligence' : 'Basic Market Intelligence'}</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                             <FaCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                            <span>{planDetails?.limits?.aiAnalysis ? 'AI Psychology Assistant' : 'Basic Journaling'}</span>
                        </li>
                         {plan === 'free' && (
                            <li className="flex items-center gap-2 text-sm text-gray-400">
                                <FaExclamationTriangle className="text-amber-500 w-4 h-4 flex-shrink-0" />
                                <span>Upgrade for AI Analysis</span>
                            </li>
                         )}
                    </ul>
                </div>
             </div>
          </div>
          
          {/* Recent Activity Placeholder */}
           <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Security</h2>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Email Address</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">Verified</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
                        <p className="text-xs text-gray-500">Use a unique password and rotate it periodically</p>
                    </div>
                    <Link
                        href="/settings"
                        className="text-sm text-emerald-500 hover:text-emerald-400 font-medium"
                    >
                        Update
                    </Link>
                </div>
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadSessions}
                                disabled={sessionsLoading}
                                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={handleLogoutAllSessions}
                                disabled={logoutAllLoading}
                                className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            >
                                {logoutAllLoading ? 'Logging out...' : 'Logout All'}
                            </button>
                        </div>
                    </div>

                    {sessionsLoading && (
                        <p className="text-xs text-gray-500">Loading sessions...</p>
                    )}
                    {!sessionsLoading && sessionsError && (
                        <p className="text-xs text-red-500">{sessionsError}</p>
                    )}
                    {!sessionsLoading && !sessionsError && sessions.length === 0 && (
                        <p className="text-xs text-gray-500">No active sessions found.</p>
                    )}
                    {!sessionsLoading && sessions.length > 0 && (
                        <div className="space-y-2">
                            {sessions.slice(0, 8).map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-zinc-800 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                            {session.userAgent || 'Unknown device'}
                                            {session.isCurrent && (
                                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                    Current
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[11px] text-gray-500 truncate">
                                            {session.ipAddress || 'Unknown IP'} • last used{' '}
                                            {formatDistanceToNow(new Date(session.lastUsedAt || session.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRevokeSession(session.id)}
                                        disabled={!!revokingSessionId || !session.isActive}
                                        className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                    >
                                        {revokingSessionId === session.id ? 'Revoking...' : 'Revoke'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
           </div>
        </div>

        {/* Usage Stats Side */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Plan Usage</h2>
                
                <div className="space-y-6">
                    {/* Trades Limit */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <FaChartLine /> Monthly Trades
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {usage.trades.used} / {usage.trades.limit}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    (usage.trades.used /
                                      (typeof usage.trades.limit === 'number' && usage.trades.limit > 0
                                        ? usage.trades.limit
                                        : 100)) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Accounts Limit */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <FaServer /> Connected Accounts
                            </span>
                             <span className="font-medium text-gray-900 dark:text-white">
                                {usage.accounts.used} / {usage.accounts.limit}
                            </span>
                        </div>
                         <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    (usage.accounts.used /
                                      (typeof usage.accounts.limit === 'number' && usage.accounts.limit > 0
                                        ? usage.accounts.limit
                                        : 1)) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-xs text-gray-500 text-center mb-4">Need more capacity? Upgrade to unlock unlimited potential.</p>
                    <Link href="/pricing" className="block w-full py-2.5 text-center text-sm font-bold rounded-lg border border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                        View Upgrade Options
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Public Identity</h3>
                <p className="text-xs text-gray-500 mb-4">Pick a unique username to show on community posts and leaderboards.</p>
                <div className="space-y-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-1">
                            <span className="text-gray-400 text-sm">@</span>
                            <input
                                value={usernameDraft}
                                onChange={(e) => setUsernameDraft(e.target.value.toLowerCase())}
                                placeholder="yourname"
                                className="w-full bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleUsernameSave}
                            disabled={usernameSaving || usernameStatus === 'checking' || usernameStatus === 'invalid' || usernameStatus === 'taken'}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {usernameSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                    {usernameError && (
                        <p className="text-xs text-red-500">{usernameError}</p>
                    )}
                    {!usernameError && usernameStatus === 'checking' && (
                        <p className="text-xs text-gray-500">Checking availability...</p>
                    )}
                    {!usernameError && usernameStatus === 'available' && (
                        <p className="text-xs text-emerald-600">Available</p>
                    )}
                    {!usernameError && usernameStatus === 'taken' && (
                        <p className="text-xs text-red-500">This username is taken.</p>
                    )}
                    {!usernameError && usernameStatus === 'invalid' && (
                        <p className="text-xs text-red-500">Use 3-20 characters, start with a letter, and only letters, numbers, or underscore.</p>
                    )}
                    {!usernameError && usernameStatus === 'error' && (
                        <p className="text-xs text-red-500">Unable to check availability right now.</p>
                    )}
                    {!usernameError && usernameStatus === 'current' && (
                        <p className="text-xs text-emerald-600">This is your current username.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Community Settings</h3>
                <p className="text-xs text-gray-500 mb-4">Control how your profile appears in Community.</p>
                {communityLoading && (
                    <p className="text-xs text-gray-500">Loading settings...</p>
                )}
                {!communityLoading && communitySettings && (
                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <label className="flex items-center justify-between">
                            <span>Public Profile</span>
                            <input
                                type="checkbox"
                                checked={communitySettings.publicProfile}
                                onChange={(e) => updateCommunitySetting({ publicProfile: e.target.checked })}
                                className="h-4 w-4"
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Participate in Rankings</span>
                            <input
                                type="checkbox"
                                checked={communitySettings.rankingOptIn}
                                onChange={(e) => updateCommunitySetting({ rankingOptIn: e.target.checked })}
                                className="h-4 w-4"
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Show Performance Metrics</span>
                            <input
                                type="checkbox"
                                checked={communitySettings.showMetrics}
                                onChange={(e) => updateCommunitySetting({ showMetrics: e.target.checked })}
                                className="h-4 w-4"
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Show Account Size Band</span>
                            <input
                                type="checkbox"
                                checked={communitySettings.showAccountSizeBand}
                                onChange={(e) => updateCommunitySetting({ showAccountSizeBand: e.target.checked })}
                                className="h-4 w-4"
                            />
                        </label>
                    </div>
                )}
                {!communityLoading && !communitySettings && (
                    <p className="text-xs text-gray-500">Unable to load community settings.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
