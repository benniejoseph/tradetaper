'use client';

import React, { useState, useEffect } from 'react';
import { FaClock, FaChartLine, FaBell, FaInfoCircle } from 'react-icons/fa';
import { getKillZones, type KillZoneData } from '@/services/ictService';

interface KillZone {
  name: string;
  start: string; // HH:MM format
  end: string;
  timeZone: string;
  description: string;
  type: 'asian' | 'london-open' | 'london-close' | 'ny-open' | 'ny-pm';
  color: string;
}

interface KillZoneStatus {
  currentZone: string | null;
  isOptimal: boolean;
  nextZone: {
    name: string;
    startsIn: number; // minutes
    timeUntil: string;
  } | null;
  allZones: KillZone[];
}

export default function KillZonesWidget() {
  const [killZoneStatus, setKillZoneStatus] = useState<KillZoneStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ICT Kill Zones (EST times)
  const killZones: KillZone[] = [
    {
      name: 'Asian Session',
      start: '19:00',
      end: '21:00',
      timeZone: 'EST',
      description: 'Low volatility, range-bound',
      type: 'asian',
      color: 'bg-gray-500',
    },
    {
      name: 'London Open',
      start: '03:00',
      end: '06:00',
      timeZone: 'EST',
      description: '🔥 HIGH PRIORITY - Major liquidity',
      type: 'london-open',
      color: 'bg-amber-500',
    },
    {
      name: 'London Close',
      start: '10:00',
      end: '11:00',
      timeZone: 'EST',
      description: 'Strong reversals possible',
      type: 'london-close',
      color: 'bg-emerald-500',
    },
    {
      name: 'NY Open / Silver Bullet',
      start: '09:00',
      end: '10:00',
      timeZone: 'EST',
      description: '⭐ PREMIUM - Best setups',
      type: 'ny-open',
      color: 'bg-emerald-600',
    },
    {
      name: 'NY PM Session',
      start: '13:00',
      end: '15:00',
      timeZone: 'EST',
      description: 'Afternoon opportunities',
      type: 'ny-pm',
      color: 'bg-emerald-700',
    },
  ];

  useEffect(() => {
    // Fetch real data from backend API
    const fetchKillZoneData = async () => {
      try {
        setLoading(true);
        const data = await getKillZones();
        setKillZoneStatus(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching kill zone data:', error);
        // Fallback to local calculation if API fails
        updateKillZoneStatus();
      }
    };

    // Initial fetch
    fetchKillZoneData();

    // Update current time every second and refresh data every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const dataRefreshTimer = setInterval(() => {
      fetchKillZoneData();
    }, 60000); // Refresh every minute

    return () => {
      clearInterval(timer);
      clearInterval(dataRefreshTimer);
    };
  }, []);

  const updateKillZoneStatus = () => {
    try {
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const hours = estTime.getHours();
      const minutes = estTime.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      let activeZone = null as KillZone | null;
      let nextZone = null as KillZone | null;
      let minDiff = Infinity;

      // Check which zone is active or next
      killZones.forEach((zone) => {
        const [startHour, startMin] = zone.start.split(':').map(Number);
        const [endHour, endMin] = zone.end.split(':').map(Number);
        const zoneStart = startHour * 60 + startMin;
        const zoneEnd = endHour * 60 + endMin;

        // Check if currently in this zone
        if (currentMinutes >= zoneStart && currentMinutes < zoneEnd) {
          activeZone = zone;
        }

        // Find next zone
        let diff = zoneStart - currentMinutes;
        if (diff < 0) diff += 24 * 60; // Next day

        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          nextZone = zone;
        }
      });

      setKillZoneStatus({
        currentZone: activeZone?.name || null,
        isOptimal: activeZone?.type === 'ny-open' || activeZone?.type === 'london-open',
        nextZone: nextZone
          ? {
              name: nextZone.name,
              startsIn: minDiff,
              timeUntil: formatTimeUntil(minDiff),
            }
          : null,
        allZones: killZones,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error updating Kill Zone status:', error);
      setLoading(false);
    }
  };

  const formatTimeUntil = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getZoneColor = (zone: KillZone): string => {
    const now = new Date();
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hours = estTime.getHours();
    const minutes = estTime.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startHour, startMin] = zone.start.split(':').map(Number);
    const [endHour, endMin] = zone.end.split(':').map(Number);
    const zoneStart = startHour * 60 + startMin;
    const zoneEnd = endHour * 60 + endMin;

    if (currentMinutes >= zoneStart && currentMinutes < zoneEnd) {
      return zone.color; // Active zone - full color
    }
    return `${zone.color} opacity-30`; // Inactive - dimmed
  };

  if (loading) {
    return (
      <div className="bg-white/5 dark:bg-black/5 rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaClock className="text-emerald-600 dark:text-emerald-400 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ICT Kill Zones
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FaClock className="text-emerald-600 dark:text-emerald-400 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ICT Kill Zones
          </h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentTime.toLocaleTimeString('en-US', { 
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })}
        </div>
      </div>

      {/* Current Kill Zone Status */}
      {killZoneStatus?.currentZone ? (
        <div className={`p-4 rounded-lg mb-6 ${
          killZoneStatus.isOptimal 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500' 
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-400'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <FaBell className={`${killZoneStatus.isOptimal ? 'text-emerald-600 animate-pulse' : 'text-emerald-600'}`} />
                <span className="font-bold text-gray-900 dark:text-white">
                  {killZoneStatus.currentZone}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {killZoneStatus.isOptimal ? '⭐ OPTIMAL TRADING TIME!' : '✓ Active Kill Zone'}
              </p>
            </div>
            <FaChartLine className={`text-3xl ${killZoneStatus.isOptimal ? 'text-emerald-600' : 'text-emerald-500'}`} />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg mb-6 border-2 border-emerald-300 dark:border-emerald-600/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <FaClock className="text-gray-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Outside Kill Zones
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Wait for optimal trading times
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Kill Zone */}
      {killZoneStatus?.nextZone && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Next Kill Zone</p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">
                {killZoneStatus.nextZone.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Starts in</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {killZoneStatus.nextZone.timeUntil}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Kill Zones Timeline */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-3">
          <FaInfoCircle className="text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Daily Kill Zones (EST)
          </p>
        </div>
        
        {killZoneStatus?.allZones?.map((zone) => {
          const isActive = killZoneStatus.currentZone === zone.name;
          
          return (
            <div
              key={zone.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-2 border-emerald-500 scale-105' 
                  : 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/10 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-700/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getZoneColor(zone)} ${isActive ? 'animate-pulse' : ''}`}></div>
                <div>
                  <p className={`font-medium ${isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-700 dark:text-gray-300'}`}>
                    {zone.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {zone.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono ${isActive ? 'text-emerald-900 dark:text-emerald-200 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                  {zone.start} - {zone.end}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{zone.timeZone}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Legend:</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
            <span className="text-gray-600 dark:text-gray-400">⭐ Premium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-gray-600 dark:text-gray-400">🔥 High Priority</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Standard</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-gray-500 opacity-30"></div>
            <span className="text-gray-600 dark:text-gray-400">Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
}

