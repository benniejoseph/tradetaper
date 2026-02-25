'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaClock, FaBolt, FaMoon, FaGlobeAmericas, FaChartLine, FaExclamationTriangle, 
  FaStar, FaRegClock, FaChartBar, FaTachometerAlt, FaFire 
} from 'react-icons/fa';
import { getKillZones } from '@/services/ictService';

interface KillZone {
  name: string;
  start: string;
  end: string;
  timeZone: string;
  description: string;
  type: string;
  color: string;
  isActive?: boolean;
}

interface KillZoneStatus {
  currentZone: string | null;
  isOptimal: boolean;
  nextZone: {
    name: string;
    startsIn: number;
    timeUntil: string;
  } | null;
  allZones: KillZone[];
}

// Common forex pairs
const FOREX_PAIRS = [
  { symbol: 'XAUUSD', name: 'Gold' },
  { symbol: 'EURUSD', name: 'EUR/USD' },
  { symbol: 'GBPUSD', name: 'GBP/USD' },
  { symbol: 'USDJPY', name: 'USD/JPY' },
  { symbol: 'BTCUSD', name: 'Bitcoin' },
  { symbol: 'NAS100', name: 'NASDAQ' },
];

// Pair-specific session data
const getPairSessionData = (symbol: string, session: string | null) => {
  const baseData = {
    XAUUSD: { avgVolatility: 150, avgVolume: 'High', momentum: 'Strong', bestSession: 'London/NY' },
    EURUSD: { avgVolatility: 80, avgVolume: 'Very High', momentum: 'Moderate', bestSession: 'London/NY' },
    GBPUSD: { avgVolatility: 100, avgVolume: 'High', momentum: 'Strong', bestSession: 'London' },
    USDJPY: { avgVolatility: 60, avgVolume: 'High', momentum: 'Moderate', bestSession: 'Asian/NY' },
    BTCUSD: { avgVolatility: 500, avgVolume: 'Medium', momentum: 'Variable', bestSession: 'All Sessions' },
    NAS100: { avgVolatility: 200, avgVolume: 'Very High', momentum: 'Strong', bestSession: 'NY' },
  };

  const pairData = baseData[symbol as keyof typeof baseData] || baseData.EURUSD;
  
  // Adjust based on current session
  let sessionMultiplier = 1;
  let volumeLevel = pairData.avgVolume;
  let momentumLevel = pairData.momentum;

  if (session) {
    const lowerSession = session.toLowerCase();
    if (lowerSession.includes('london') || lowerSession.includes('ny')) {
      sessionMultiplier = 1.5;
      volumeLevel = 'Very High';
      momentumLevel = 'Strong';
    } else if (lowerSession.includes('asian')) {
      sessionMultiplier = 0.6;
      volumeLevel = 'Low';
      momentumLevel = 'Ranging';
    }
  } else {
    sessionMultiplier = 0.3;
    volumeLevel = 'Very Low';
    momentumLevel = 'Weak';
  }

  return {
    volatilityPips: Math.round(pairData.avgVolatility * sessionMultiplier),
    volume: volumeLevel,
    momentum: momentumLevel,
    bestSession: pairData.bestSession,
  };
};

export default function KillZoneBanner() {
  const [status, setStatus] = useState<KillZoneStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPair, setSelectedPair] = useState('XAUUSD');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getKillZones();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching kill zones:', error);
        setStatus({
          currentZone: null,
          isOptimal: false,
          nextZone: { name: 'London Open', startsIn: 120, timeUntil: '2h 00m' },
          allZones: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Format current time
  const formatTime = (date: Date, tz: string) => {
    return date.toLocaleTimeString('en-US', { 
      timeZone: tz, 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Get session duration
  const getSessionDuration = (zoneName: string | null) => {
    if (!zoneName) return null;
    const lower = zoneName.toLowerCase();
    if (lower.includes('london open') || lower.includes('ny open')) return '2h 30m';
    if (lower.includes('silver bullet')) return '1h 00m';
    if (lower.includes('london close')) return '1h 30m';
    if (lower.includes('asian')) return '3h 00m';
    return '2h 00m';
  };

  if (loading) {
    return (
      <div className="w-full h-20 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse"></div>
    );
  }

  const isActive = status?.currentZone !== null;
  const currentZone = status?.currentZone ?? null;
  const nextZone = status?.nextZone ?? null;
  const isOptimal = status?.isOptimal;

  // Get zone-specific info
  const getZoneInfo = (zoneName: string | null) => {
    if (!zoneName) return { priority: 'N/A', volatility: 'Low', session: 'Off Hours' };
    const lowerZone = zoneName.toLowerCase();
    if (lowerZone.includes('london open')) return { priority: 'HIGH', volatility: 'Very High', session: 'London' };
    if (lowerZone.includes('ny open') || lowerZone.includes('silver bullet')) return { priority: 'PREMIUM', volatility: 'High', session: 'New York' };
    if (lowerZone.includes('london close')) return { priority: 'MEDIUM', volatility: 'Medium', session: 'London Close' };
    if (lowerZone.includes('asian')) return { priority: 'LOW', volatility: 'Low', session: 'Asian' };
    if (lowerZone.includes('ny pm')) return { priority: 'MEDIUM', volatility: 'Medium', session: 'NY PM' };
    return { priority: 'NORMAL', volatility: 'Normal', session: 'Mixed' };
  };

  const zoneInfo = getZoneInfo(currentZone);
  const pairData = getPairSessionData(selectedPair, currentZone);
  const sessionDuration = getSessionDuration(currentZone);

  return (
    <div className={`w-full rounded-xl border ${
      isActive 
        ? 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
        : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
    }`}>
      
      <div className="px-5 py-4">
        {/* Top Row: Main Info */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          
          {/* Left Section: Status Icon & Zone Info */}
          <div className="flex items-center gap-4">
            {/* Status Icon */}
            <div className={`p-2.5 rounded-xl ${
              isActive 
                ? 'bg-white/20 backdrop-blur-sm' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              {isActive ? (
                isOptimal ? <FaStar className="w-5 h-5" /> : <FaBolt className="w-5 h-5" />
              ) : (
                <FaMoon className="w-5 h-5" />
              )}
            </div>
            
            {/* Zone Name & Status */}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  ICT Kill Zone
                </span>
                {isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
              </div>
              <p className={`text-base font-bold ${isActive ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                {isActive ? currentZone : 'Outside Kill Zone Hours'}
              </p>
            </div>
          </div>

          {/* Right Section: Pair Selector & Times */}
          <div className="flex items-center gap-4">
            {/* Pair Selector */}
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${
                isActive 
                  ? 'bg-white/20 text-white border border-white/30 backdrop-blur-sm' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600'
              }`}
            >
              {FOREX_PAIRS.map(pair => (
                <option key={pair.symbol} value={pair.symbol} className="text-gray-900">
                  {pair.symbol}
                </option>
              ))}
            </select>

            {/* World Clock */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <FaGlobeAmericas className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
                <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  EST {formatTime(currentTime, 'America/New_York')}
                </span>
              </div>
              <div className={`w-px h-4 ${isActive ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                UTC {formatTime(currentTime, 'UTC')}
              </span>
            </div>

            {/* Status Badge */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${
              isActive 
                ? 'bg-white text-emerald-600' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
        </div>

        {/* Bottom Row: Detailed Metrics */}
        <div className={`flex items-center gap-6 flex-wrap pt-2 border-t ${
          isActive ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'
        }`}>
          
          {/* Session */}
          <div className="flex items-center gap-2">
            <FaGlobeAmericas className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>Session</p>
              <p className="text-sm font-semibold">{zoneInfo.session}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <FaRegClock className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>Duration</p>
              <p className="text-sm font-semibold">{sessionDuration || 'N/A'}</p>
            </div>
          </div>

          {/* Volatility for Selected Pair */}
          <div className="flex items-center gap-2">
            <FaChartLine className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>{selectedPair} Volatility</p>
              <p className="text-sm font-semibold">{pairData.volatilityPips} pips</p>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <FaChartBar className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>Volume</p>
              <p className="text-sm font-semibold">{pairData.volume}</p>
            </div>
          </div>

          {/* Momentum */}
          <div className="flex items-center gap-2">
            <FaTachometerAlt className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>Momentum</p>
              <p className="text-sm font-semibold">{pairData.momentum}</p>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>Priority</p>
              <p className="text-sm font-semibold">{zoneInfo.priority}</p>
            </div>
          </div>

          {/* Best Session for Pair */}
          <div className="hidden lg:flex items-center gap-2">
            <FaFire className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500'}`}>Best for {selectedPair}</p>
              <p className="text-sm font-semibold">{pairData.bestSession}</p>
            </div>
          </div>

          {/* Next Zone Countdown */}
          {nextZone && (
            <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isActive 
                ? 'bg-white/15 backdrop-blur-sm' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <FaClock className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`} />
              <div>
                <p className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
                  {isActive ? 'Session ends' : `Next: ${nextZone.name}`}
                </p>
                <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                  {nextZone.timeUntil}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
