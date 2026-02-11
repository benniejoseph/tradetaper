'use client';

import React, { useState, useEffect } from 'react';
import { FaClock, FaGlobe, FaChartLine, FaBell, FaFire, FaWater } from 'react-icons/fa';

interface TradingSession {
  name: string;
  region: 'Asia' | 'Europe' | 'America';
  markets: string[];
  startUTC: number;
  endUTC: number;
  color: string;
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  liquidity: number;
  bestForex: string[];
  bestCommodities: string[];
  bestIndices: string[];
  description: string;
  isPremium?: boolean;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'EST', abbr: 'EST' },
  { value: 'Europe/London', label: 'GMT', abbr: 'GMT' },
  { value: 'Asia/Tokyo', label: 'JST', abbr: 'JST' },
  { value: 'Asia/Singapore', label: 'SGT', abbr: 'SGT' },
  { value: 'Australia/Sydney', label: 'AEDT', abbr: 'AEDT' },
  { value: 'local', label: 'Local', abbr: 'Local' },
];

const TRADING_SESSIONS: TradingSession[] = [
  {
    name: 'Asian Session',
    region: 'Asia',
    markets: ['Tokyo', 'Sydney', 'Singapore', 'Hong Kong'],
    startUTC: 23,
    endUTC: 8,
    color: 'bg-blue-500',
    volatility: 'Low',
    liquidity: 6,
    bestForex: ['AUD/JPY', 'NZD/JPY', 'EUR/JPY', 'AUD/USD'],
    bestCommodities: ['Gold', 'Silver'],
    bestIndices: ['Nikkei 225', 'ASX 200', 'Hang Seng'],
    description: 'Range-bound trading, lower volatility',
  },
  {
    name: 'European Session',
    region: 'Europe',
    markets: ['London', 'Frankfurt', 'Paris', 'Zurich'],
    startUTC: 7,
    endUTC: 16,
    color: 'bg-amber-500',
    volatility: 'High',
    liquidity: 9,
    bestForex: ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'USD/CHF'],
    bestCommodities: ['Brent Oil', 'Natural Gas', 'Gold'],
    bestIndices: ['DAX', 'FTSE 100', 'CAC 40', 'Euro Stoxx 50'],
    description: 'High volume, strong trends',
    isPremium: true,
  },
  {
    name: 'North American Session',
    region: 'America',
    markets: ['New York', 'Chicago', 'Toronto'],
    startUTC: 13,
    endUTC: 22,
    color: 'bg-emerald-600',
    volatility: 'Very High',
    liquidity: 10,
    bestForex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD'],
    bestCommodities: ['WTI Oil', 'Gold', 'Copper', 'Natural Gas'],
    bestIndices: ['S&P 500', 'NASDAQ', 'Dow Jones', 'Russell 2000'],
    description: 'Highest liquidity, strongest moves',
    isPremium: true,
  },
];

export default function SessionDetailsWidget() {
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSession, setActiveSession] = useState<TradingSession | null>(null);
  const [overlappingSessions, setOverlappingSessions] = useState<TradingSession[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    updateSessionStatus();
  }, [currentTime]);

  const updateSessionStatus = () => {
    const utcHours = currentTime.getUTCHours();
    const utcMinutes = currentTime.getUTCMinutes();
    const currentUTCTime = utcHours + utcMinutes / 60;

    const active: TradingSession[] = [];
    TRADING_SESSIONS.forEach(session => {
      const isActive = isSessionActive(currentUTCTime, session.startUTC, session.endUTC);
      if (isActive) active.push(session);
    });

    setActiveSession(active[0] || null);
    setOverlappingSessions(active.length > 1 ? active : []);
  };

  const isSessionActive = (currentTime: number, start: number, end: number): boolean => {
    if (start > end) return currentTime >= start || currentTime < end;
    return currentTime >= start && currentTime < end;
  };

  const convertUTCToSelectedTZ = (utcHour: number): string => {
    const date = new Date();
    date.setUTCHours(utcHour, 0, 0, 0);
    const tz = selectedTimezone === 'local' 
      ? Intl.DateTimeFormat().resolvedOptions().timeZone 
      : selectedTimezone;
    return date.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getCurrentTimeInTZ = (): string => {
    const tz = selectedTimezone === 'local' 
      ? Intl.DateTimeFormat().resolvedOptions().timeZone 
      : selectedTimezone;
    return currentTime.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getVolatilityIcon = (volatility: string) => {
    switch (volatility) {
      case 'Very High':
      case 'High':
        return <FaFire className="text-red-500" />;
      case 'Medium':
        return <FaChartLine className="text-yellow-500" />;
      case 'Low':
        return <FaWater className="text-blue-500" />;
      default:
        return null;
    }
  };

  const selectedTZLabel = TIMEZONES.find(tz => tz.value === selectedTimezone)?.abbr || 'UTC';

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-6 bg-white dark:bg-[#022c22] border border-slate-200 dark:border-emerald-900 rounded-xl shadow-sm p-0 overflow-hidden">
      {/* Header - Emerald Gradient */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-600 p-4 text-white flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
            <FaGlobe className="w-6 h-6 text-emerald-50" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Market Sessions</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-emerald-50 text-sm opacity-80">
                {overlappingSessions.length > 1 ? '⚡ Session Overlap' : activeSession ? `${activeSession.name}` : 'Between Sessions'}
              </span>
              {/* Timezone Selector */}
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value} className="text-gray-900">{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="text-right mt-3 md:mt-0">
          <div className="text-3xl font-black">{getCurrentTimeInTZ()}</div>
          <div className="text-[10px] uppercase tracking-widest opacity-60">{selectedTZLabel}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Current Status */}
        <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-emerald-900/50 pb-4 md:pb-0 md:pr-6">
          <h4 className="text-sm font-semibold text-slate-500 dark:text-emerald-400 uppercase tracking-wider mb-3">Current Status</h4>
          
          {overlappingSessions.length > 1 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FaBell className="text-amber-500 animate-pulse" />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">OVERLAP PERIOD</span>
              </div>
              <p className="text-slate-700 dark:text-emerald-100 leading-relaxed text-sm">
                {overlappingSessions.map(s => s.name).join(' + ')} are both active. Highest liquidity and volatility period.
              </p>
              <div className="flex gap-2">
                {overlappingSessions.map((session, idx) => (
                  <div key={idx} className={`w-3 h-3 rounded-full ${session.color} animate-pulse`}></div>
                ))}
              </div>
            </div>
          ) : activeSession ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${activeSession.color} animate-pulse`}></div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {activeSession.name.toUpperCase()}
                  {activeSession.isPremium && ' ⭐'}
                </span>
              </div>
              <p className="text-slate-700 dark:text-emerald-100 leading-relaxed text-sm">
                {activeSession.description}. Markets: {activeSession.markets.join(', ')}.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-emerald-200/70">
                {getVolatilityIcon(activeSession.volatility)}
                <span>{activeSession.volatility} Volatility</span>
                <span className="mx-1">•</span>
                <span>Liquidity: {activeSession.liquidity}/10</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FaClock className="text-gray-400" />
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">BETWEEN SESSIONS</span>
              </div>
              <p className="text-slate-700 dark:text-emerald-100 leading-relaxed text-sm">
                Low liquidity period. Wait for the next major session to open for optimal trading conditions.
              </p>
            </div>
          )}
        </div>

        {/* All Sessions Grid */}
        <div className="md:w-2/3 grid gap-3 grid-cols-1 md:grid-cols-3">
          {TRADING_SESSIONS.map((session) => {
            const isActive = activeSession?.name === session.name;
            const isOverlapping = overlappingSessions.some(s => s.name === session.name);
            
            return (
              <div 
                key={session.name} 
                className={`rounded-lg p-3 border transition-all ${
                  isActive || isOverlapping
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-600 scale-105'
                    : 'bg-slate-50 dark:bg-emerald-900/20 border-slate-200 dark:border-emerald-800/50'
                }`}
              >
                {/* Session Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${session.color} ${isActive ? 'animate-pulse' : 'opacity-50'}`}></div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${
                    isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-emerald-400'
                  }`}>
                    {session.region}
                    {session.isPremium && ' ⭐'}
                  </span>
                </div>
                
                {/* Session Name & Time */}
                <h4 className={`font-semibold text-xs mb-1 ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-emerald-100'
                }`}>
                  {session.name}
                </h4>
                <p className="text-[10px] text-slate-600 dark:text-emerald-200/70 mb-2 font-mono">
                  {convertUTCToSelectedTZ(session.startUTC)} - {convertUTCToSelectedTZ(session.endUTC)}
                </p>
                
                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-emerald-200/70 leading-relaxed mb-3">
                  {session.description}
                </p>
                
                {/* Best Assets */}
                <div className="space-y-1.5">
                  <div className="bg-white dark:bg-emerald-950/50 rounded p-1.5 border border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">💱 FOREX</p>
                    <div className="flex flex-wrap gap-1">
                      {session.bestForex.slice(0, 2).map((pair) => (
                        <span key={pair} className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
                          {pair}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-emerald-950/50 rounded p-1.5 border border-amber-100 dark:border-amber-900/50">
                    <p className="text-[9px] font-semibold text-amber-700 dark:text-amber-300 mb-1">🛢️ COMMODITIES</p>
                    <div className="flex flex-wrap gap-1">
                      {session.bestCommodities.slice(0, 2).map((commodity) => (
                        <span key={commodity} className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded">
                          {commodity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-emerald-950/50 rounded p-1.5 border border-blue-100 dark:border-blue-900/50">
                    <p className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 mb-1">📈 INDICES</p>
                    <div className="flex flex-wrap gap-1">
                      {session.bestIndices.slice(0, 2).map((index) => (
                        <span key={index} className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                          {index}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
