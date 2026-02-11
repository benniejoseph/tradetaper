'use client';

import React, { useState, useEffect } from 'react';
import { FaClock, FaGlobe, FaChartLine, FaBell, FaInfoCircle, FaFire, FaWater } from 'react-icons/fa';

interface TradingSession {
  name: string;
  region: 'Asia' | 'Europe' | 'America';
  markets: string[];
  startUTC: number; // Hours in UTC (0-23)
  endUTC: number;
  color: string;
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  liquidity: number; // 1-10 scale
  bestPairs: string[];
  description: string;
  isPremium?: boolean;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'EST (New York)', abbr: 'EST' },
  { value: 'Europe/London', label: 'GMT (London)', abbr: 'GMT' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)', abbr: 'JST' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore)', abbr: 'SGT' },
  { value: 'Australia/Sydney', label: 'AEDT (Sydney)', abbr: 'AEDT' },
  { value: 'local', label: 'Local Time', abbr: 'Local' },
];

const TRADING_SESSIONS: TradingSession[] = [
  {
    name: 'Asian Session',
    region: 'Asia',
    markets: ['Tokyo', 'Sydney', 'Singapore', 'Hong Kong'],
    startUTC: 23, // 11 PM UTC (previous day)
    endUTC: 8,    // 8 AM UTC
    color: 'bg-blue-500',
    volatility: 'Low',
    liquidity: 6,
    bestPairs: ['AUD/JPY', 'NZD/JPY', 'EUR/JPY', 'AUD/USD'],
    description: 'Range-bound trading, lower volatility, good for JPY pairs',
  },
  {
    name: 'European Session',
    region: 'Europe',
    markets: ['London', 'Frankfurt', 'Paris', 'Zurich'],
    startUTC: 7,  // 7 AM UTC
    endUTC: 16,   // 4 PM UTC
    color: 'bg-amber-500',
    volatility: 'High',
    liquidity: 9,
    bestPairs: ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'USD/CHF'],
    description: 'High volume, strong trends, major economic releases',
    isPremium: true,
  },
  {
    name: 'North American Session',
    region: 'America',
    markets: ['New York', 'Chicago', 'Toronto'],
    startUTC: 13, // 1 PM UTC
    endUTC: 22,   // 10 PM UTC
    color: 'bg-emerald-600',
    volatility: 'Very High',
    liquidity: 10,
    bestPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD'],
    description: 'Highest liquidity, strongest moves, overlaps with London',
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
      if (isActive) {
        active.push(session);
      }
    });

    setActiveSession(active[0] || null);
    setOverlappingSessions(active.length > 1 ? active : []);
  };

  const isSessionActive = (currentTime: number, start: number, end: number): boolean => {
    if (start > end) {
      // Session crosses midnight
      return currentTime >= start || currentTime < end;
    }
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

  const getVolatilityColor = (volatility: string): string => {
    switch (volatility) {
      case 'Very High':
        return 'text-red-600 dark:text-red-400';
      case 'High':
        return 'text-orange-600 dark:text-orange-400';
      case 'Medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Low':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const selectedTZLabel = TIMEZONES.find(tz => tz.value === selectedTimezone)?.abbr || 'UTC';

  return (
    <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaGlobe className="text-emerald-600 dark:text-emerald-400 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Session Details
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-500 animate-pulse"></span>
            Live
          </span>
        </div>
        
        {/* Timezone Selector */}
        <div className="flex items-center space-x-2">
          <FaClock className="text-gray-400 text-sm" />
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg p-4 mb-6 border border-emerald-200 dark:border-emerald-700/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Time ({selectedTZLabel})</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 font-mono">
              {getCurrentTimeInTZ()}
            </p>
          </div>
          <div className="text-sm text-right">
            <p className="text-gray-600 dark:text-gray-400">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Active Session Status */}
      {overlappingSessions.length > 1 ? (
        <div className="p-4 rounded-lg mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FaBell className="text-amber-600 animate-pulse" />
                <span className="font-bold text-gray-900 dark:text-white">
                  ⚡ SESSION OVERLAP - PREMIUM TIME
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {overlappingSessions.map(s => s.name).join(' + ')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                🔥 Highest liquidity and volatility period
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {overlappingSessions.map((session, idx) => (
                  <div key={idx} className={`w-4 h-4 rounded-full ${session.color} animate-pulse`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeSession ? (
        <div className={`p-4 rounded-lg mb-6 ${
          activeSession.isPremium 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500' 
            : 'bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-400'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${activeSession.color} animate-pulse`}></div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {activeSession.name}
                </span>
                {activeSession.isPremium && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 rounded-full">
                    ⭐ Premium
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                ✓ {activeSession.description}
              </p>
            </div>
            <FaChartLine className={`text-3xl ${activeSession.isPremium ? 'text-emerald-600' : 'text-blue-500'}`} />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg mb-6 border-2 border-gray-300 dark:border-gray-600/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <FaClock className="text-gray-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Between Sessions
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Low liquidity period - wait for next session
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Trading Sessions */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 mb-3">
          <FaInfoCircle className="text-gray-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Global Trading Sessions ({selectedTZLabel})
          </p>
        </div>

        {TRADING_SESSIONS.map((session) => {
          const isActive = activeSession?.name === session.name;
          const isOverlapping = overlappingSessions.some(s => s.name === session.name);
          
          return (
            <div
              key={session.name}
              className={`p-4 rounded-lg transition-all ${
                isActive || isOverlapping
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-2 border-emerald-500 scale-[1.02]' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/10 dark:to-gray-800/10 border border-gray-200 dark:border-gray-700/30'
              }`}
            >
              {/* Session Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${session.color} ${isActive ? 'animate-pulse' : 'opacity-50'}`}></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className={`font-semibold ${isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-700 dark:text-gray-300'}`}>
                        {session.name}
                      </p>
                      {session.isPremium && (
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 rounded">
                          ⭐
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.markets.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono font-semibold ${isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-600 dark:text-gray-400'}`}>
                    {convertUTCToSelectedTZ(session.startUTC)} - {convertUTCToSelectedTZ(session.endUTC)}
                  </p>
                  {isActive && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      ● Active Now
                    </p>
                  )}
                </div>
              </div>

              {/* Session Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Volatility */}
                <div className="bg-white dark:bg-gray-900/50 rounded-md p-2">
                  <div className="flex items-center space-x-1.5 mb-1">
                    {getVolatilityIcon(session.volatility)}
                    <p className="text-xs text-gray-500 dark:text-gray-400">Volatility</p>
                  </div>
                  <p className={`text-sm font-semibold ${getVolatilityColor(session.volatility)}`}>
                    {session.volatility}
                  </p>
                </div>

                {/* Liquidity */}
                <div className="bg-white dark:bg-gray-900/50 rounded-md p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Liquidity</p>
                  <div className="flex items-center space-x-1">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${session.color} h-2 rounded-full`}
                        style={{ width: `${session.liquidity * 10}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {session.liquidity}/10
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                📊 {session.description}
              </p>

              {/* Best Pairs */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Pairs:</p>
                <div className="flex flex-wrap gap-1">
                  {session.bestPairs.map((pair) => (
                    <span
                      key={pair}
                      className="text-xs px-2 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300"
                    >
                      {pair}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Overlap Info */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Session Overlap Times</p>
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-gray-900"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white dark:border-gray-900"></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">London + New York:</span> {convertUTCToSelectedTZ(13)} - {convertUTCToSelectedTZ(16)} (⚡ Highest liquidity)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-gray-900"></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Asia + London:</span> {convertUTCToSelectedTZ(7)} - {convertUTCToSelectedTZ(8)} (Moderate activity)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
