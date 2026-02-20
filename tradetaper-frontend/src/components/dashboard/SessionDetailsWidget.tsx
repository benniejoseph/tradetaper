'use client';

import React, { useState, useEffect } from 'react';
import { FaClock, FaGlobe, FaChartLine, FaBell, FaFire, FaWater, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Set initial client-side only state to avoid hydration mismatch if needed
    // but here we just start timer
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
    calculateTimeRemaining(currentUTCTime, active);
  };

  const isSessionActive = (currentTime: number, start: number, end: number): boolean => {
    if (start > end) return currentTime >= start || currentTime < end;
    return currentTime >= start && currentTime < end;
  };

  const calculateTimeRemaining = (currentUTCTime: number, active: TradingSession[]) => {
      let targetTime = 0;
      let label = '';
      
      if (active.length > 0) {
          // Find earliest closing time of active sessions
           // Handle day rollover for closing time logic if needed, but simplistic approach:
           // If session ends next day (start > end), end is effectively end+24 for calculation if current > start
           
           let minRemaining = Infinity;
           
           active.forEach(s => {
               let endTime = s.endUTC;
               if (s.startUTC > s.endUTC && currentUTCTime >= s.startUTC) {
                   endTime += 24;
               } else if (s.startUTC > s.endUTC && currentUTCTime < s.endUTC) {
                   // e.g. current 2, end 8. No change needed.
               }
               
               const diff = endTime - currentUTCTime;
               if (diff < minRemaining) minRemaining = diff;
           });
           
           targetTime = minRemaining;
           label = 'closes in';
      } else {
          // Find next opening session
          let minUntilOpen = Infinity;
          TRADING_SESSIONS.forEach(s => {
             let startTime = s.startUTC;
             let diff = startTime - currentUTCTime;
             if (diff < 0) diff += 24; // Opening tomorrow
             
             if (diff < minUntilOpen) minUntilOpen = diff;
          });
          targetTime = minUntilOpen;
          label = 'opens in';
      }
      
      const hours = Math.floor(targetTime);
      const minutes = Math.floor((targetTime - hours) * 60);
      const seconds = Math.floor(((targetTime - hours) * 60 - minutes) * 60);
      
      setTimeRemaining(`${label} ${hours}h ${minutes}m`);
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
    <div className="col-span-1 sm:col-span-2 lg:col-span-6 bg-white dark:bg-[#022c22] border border-slate-200 dark:border-emerald-900 rounded-xl shadow-sm p-0 overflow-hidden transition-all duration-300">
      {/* Header - Collapsible Trigger */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-emerald-900 to-emerald-600 p-4 text-white cursor-pointer hover:brightness-110 transition-all"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
                    <FaGlobe className="w-6 h-6 text-emerald-50" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Market Sessions
                        <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {overlappingSessions.length > 1 && <FaBell className="w-3 h-3 text-amber-300 animate-pulse" />}
                            {overlappingSessions.length > 1 ? 'Overlap Priority' : activeSession ? 'Market Open' : 'Markets Closed'}
                        </span>
                    </h3>
                    
                    {/* Compact Summary Line */}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-emerald-50/90">
                        <span className="font-semibold text-white">
                            {overlappingSessions.length > 1 
                                ? overlappingSessions.map(s => s.name.split(' ')[0]).join(' + ') 
                                : activeSession ? activeSession.name : 'Between Sessions'}
                        </span>
                        <span className="hidden md:inline text-emerald-50/40">|</span>
                        <span className="flex items-center gap-1">
                            <FaClock className="w-3 h-3 opacity-70" />
                            {timeRemaining}
                        </span>
                        {activeSession && (
                            <>
                                <span className="hidden md:inline text-emerald-50/40">|</span>
                                <span className="flex items-center gap-1 text-xs uppercase tracking-wider opacity-80">
                                   {/* Simple Volatility Indicator for Header */}
                                   Vol: {activeSession.volatility}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side: Clock & Controls */}
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                {/* Time Display */}
                <div className="text-right">
                    <div className="text-2xl md:text-3xl font-black font-mono tracking-tight leading-none">
                        {getCurrentTimeInTZ()}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1 flex justify-end gap-2 items-center">
                        <select
                            onClick={(e) => e.stopPropagation()}
                            value={selectedTimezone}
                            onChange={(e) => setSelectedTimezone(e.target.value)}
                            className="bg-transparent border-none p-0 text-white/60 text-[10px] focus:ring-0 cursor-pointer hover:text-white"
                        >
                            {TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value} className="text-gray-900">{tz.abbr}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Expand Toggle */}
                <div className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </div>
            </div>
        </div>
        
        {/* Helper Hint if collapsed */}
        {!isExpanded && (
            <div className="text-center mt-2 text-[10px] text-white/40 uppercase tracking-widest animate-pulse">
                Click to expand session details
            </div>
        )}
      </div>

      {/* Collapsible Content */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col md:flex-row gap-6 p-6 border-t border-slate-100 dark:border-emerald-900/30">
            {/* Current Status Detail */}
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
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-600 shadow-md'
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
                    <h4 className={`font-semibold text-sm mb-1 ${
                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-emerald-100'
                    }`}>
                    {session.name}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-emerald-200/70 mb-2 font-mono bg-white/50 dark:bg-black/20 inline-block px-1.5 py-0.5 rounded">
                    {convertUTCToSelectedTZ(session.startUTC)} - {convertUTCToSelectedTZ(session.endUTC)}
                    </p>
                    
                    {/* Major Markets */}
                    <div className="mb-3">
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-emerald-500/80 mb-1">Key Markets</p>
                        <div className="flex flex-wrap gap-1">
                            {session.markets.map(m => (
                                <span key={m} className="text-[10px] px-1.5 py-0.5 bg-slate-200/50 dark:bg-white/5 text-slate-700 dark:text-emerald-200/80 rounded">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-emerald-200/70 leading-relaxed mb-3 italic">
                    {session.description}
                    </p>
                    
                    {/* Best Assets */}
                    <div className="space-y-2">
                    <div className="bg-white dark:bg-emerald-950/30 rounded p-2 border border-emerald-100 dark:border-emerald-900/30">
                        <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 mb-1.5 flex items-center gap-1">
                            💱 FOREX
                        </p>
                        <div className="flex flex-wrap gap-1">
                        {session.bestForex.map((pair) => (
                            <span key={pair} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-100 dark:border-emerald-800/30">
                            {pair}
                            </span>
                        ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-emerald-950/30 rounded p-2 border border-amber-100 dark:border-amber-900/30">
                        <p className="text-[9px] font-bold text-amber-700 dark:text-amber-300 mb-1.5 flex items-center gap-1">
                            🛢️ COMMODITIES
                        </p>
                        <div className="flex flex-wrap gap-1">
                        {session.bestCommodities.map((commodity) => (
                            <span key={commodity} className="text-[10px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded border border-amber-100 dark:border-amber-800/30">
                            {commodity}
                            </span>
                        ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-emerald-950/30 rounded p-2 border border-blue-100 dark:border-emerald-900/30">
                        <p className="text-[9px] font-bold text-blue-700 dark:text-emerald-300 mb-1.5 flex items-center gap-1">
                            📈 INDICES
                        </p>
                        <div className="flex flex-wrap gap-1">
                        {session.bestIndices.map((index) => (
                            <span key={index} className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-emerald-900/40 text-blue-700 dark:text-emerald-300 rounded border border-blue-100 dark:border-emerald-800/30">
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
    </div>
  );
}
