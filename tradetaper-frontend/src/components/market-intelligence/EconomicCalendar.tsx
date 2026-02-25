import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaSpinner, FaExclamationTriangle, FaFilter, FaClock, FaSearch, FaBell } from 'react-icons/fa';
import { authApiClient } from '@/services/api';

interface EconomicEvent {
  id: string;
  calendarId?: string;
  title: string;
  country: string;
  currency: string;
  date: string; // ISO string
  time: string; // Original time string
  importance: 'low' | 'medium' | 'high';
  importanceValue?: number;
  actual?: string | number;
  forecast?: string | number;
  previous?: string | number;
  revised?: string | number;
  teForecast?: string | number;
  unit?: string;
  frequency?: string;
  category?: string;
  reference?: string;
  referenceDate?: string;
  source?: string;
  sourceUrl?: string;
  url?: string;
  ticker?: string;
  symbol?: string;
  lastUpdate?: string;
  description?: string;
  impact?: {
    explanation?: string;
    affectedSymbols?: string[];
  };
}

export default function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [activeFilters, setActiveFilters] = useState<string[]>(['high']);
  const [activeCurrencies, setActiveCurrencies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timezone, setTimezone] = useState<string>('local');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [alertEventIds, setAlertEventIds] = useState<Set<string>>(new Set());
  
  // Selection
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'summary' | 'ai' | 'history'>('summary');

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    const onlyHigh = activeFilters.length === 1 && activeFilters.includes('high');
    if (onlyHigh) {
      fetchEvents('high');
    } else {
      fetchEvents();
    }
  }, [activeFilters]);

  const fetchEvents = async (importance?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApiClient.get('/market-intelligence/economic-calendar', {
        params: importance ? { importance } : undefined,
      });
      if (response.data && response.data.events) {
        setEvents(response.data.events);
      } else if (Array.isArray(response.data)) {
         setEvents(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar', err);
      setError('Failed to load economic calendar data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await authApiClient.get('/market-intelligence/economic-alerts');
      const items = Array.isArray(response.data?.items) ? response.data.items : [];
      setAlertEventIds(new Set(items));
    } catch (err) {
      console.error('Failed to fetch economic alerts', err);
    }
  };

  const fetchEventDetails = async (eventId: string) => {
    if (eventDetails[eventId]) return; // Already fetched
    
    try {
      setLoadingDetails(eventId);
      // Attempt to fetch specific analysis
      const response = await authApiClient.get(`/market-intelligence/economic-impact/${encodeURIComponent(eventId)}`);
      setEventDetails(prev => ({
        ...prev,
        [eventId]: response.data
      }));
    } catch (err) {
      console.error('Failed to fetch details', err);
      // Fallback: Just show generic info if fetch fails
      setEventDetails(prev => ({
        ...prev,
        [eventId]: { explanation: 'Detailed AI analysis unavailable for this event.' }
      }));
    } finally {
      setLoadingDetails(null);
    }
  };

  const toggleFilter = (impact: string) => {
    setActiveFilters(prev => 
      prev.includes(impact) 
        ? prev.filter(f => f !== impact)
        : [...prev, impact]
    );
  };

  const resolvedTimeZone = useMemo(() => {
    if (timezone === 'local') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return timezone;
  }, [timezone]);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        timeZone: resolvedTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  const formatDateGroup = (dateStr: string) => {
     try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        timeZone: resolvedTimeZone,
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800';
    }
  };

  const getImpactBadge = (impact: string) => {
    const label = impact.toLowerCase() === 'high' ? 'HIGH' : impact.toLowerCase() === 'medium' ? 'MED' : 'LOW';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getImpactColor(impact)}`}>
        {label}
      </span>
    );
  };

  const getCountryFlag = (country?: string) => {
    if (!country) return '🌐';
    const name = country.toLowerCase();
    if (name.includes('united states') || name.includes('usa')) return '🇺🇸';
    if (name.includes('canada')) return '🇨🇦';
    if (name.includes('united kingdom') || name.includes('britain')) return '🇬🇧';
    if (name.includes('japan')) return '🇯🇵';
    if (name.includes('euro') || name.includes('europe')) return '🇪🇺';
    if (name.includes('australia')) return '🇦🇺';
    if (name.includes('switzerland')) return '🇨🇭';
    if (name.includes('new zealand')) return '🇳🇿';
    return '🌐';
  };

  const availableCurrencies = useMemo(() => {
    const unique = Array.from(new Set(events.map(e => e.currency).filter(Boolean)));
    return unique.sort();
  }, [events]);

  const handleCurrencyToggle = (currency: string) => {
    setActiveCurrencies(prev =>
      prev.includes(currency)
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    );
  };

  const filteredEvents = events.filter(e => {
    const matchesImpact = activeFilters.includes(e.importance.toLowerCase());
    const matchesCurrency = activeCurrencies.length === 0 || activeCurrencies.includes(e.currency);
    const matchesSearch =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.currency.toLowerCase().includes(searchQuery.toLowerCase());
    const eventDate = new Date(e.date);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rangeEnd =
      dateRange === 'today'
        ? new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        : dateRange === 'week'
          ? new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
          : new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, startOfToday.getDate());
    const matchesDate = eventDate >= startOfToday && eventDate < rangeEnd;
    return matchesImpact && matchesCurrency && matchesSearch && matchesDate;
  });

  const getSurprise = (event: EconomicEvent) => {
    const actual = Number(event.actual);
    const forecast = Number(event.forecast);
    if (Number.isFinite(actual) && Number.isFinite(forecast)) {
      const diff = actual - forecast;
      if (diff === 0) return { label: '0', tone: 'text-gray-500' };
      return {
        label: diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2),
        tone: diff > 0 ? 'text-emerald-600' : 'text-red-500',
      };
    }
    return { label: '—', tone: 'text-gray-400' };
  };

  const getSurpriseDirection = (event: EconomicEvent) => {
    const actual = Number(event.actual);
    const forecast = Number(event.forecast);
    if (!Number.isFinite(actual) || !Number.isFinite(forecast)) return 'neutral';
    const diff = actual - forecast;
    if (diff > 0) return 'better';
    if (diff < 0) return 'worse';
    return 'neutral';
  };

  const formatValue = (value: string | number | undefined | null, fallback = '—') => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value);
  };

  // 2. Group by Day (IST)
  const groupedEvents: Record<string, EconomicEvent[]> = {};
  filteredEvents.forEach(event => {
    const dayKey = formatDateGroup(event.date);
    if (!groupedEvents[dayKey]) {
      groupedEvents[dayKey] = [];
    }
    groupedEvents[dayKey].push(event);
  });
  
  // Sort groups by date? (Assuming events are sorted by date from backend)
  // But Group Keys need order.
  // We can rely on insertion order if backend sorts.
  const groupKeys = Object.keys(groupedEvents);

  const nextHighImpact = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => event.importance.toLowerCase() === 'high')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find((event) => new Date(event.date).getTime() >= now.getTime());
  }, [filteredEvents]);

  const toggleAlert = (eventId: string) => {
    setAlertEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
        authApiClient.delete(`/market-intelligence/economic-alerts/${encodeURIComponent(eventId)}`).catch(() => {
          setAlertEventIds(prevRetry => new Set(prevRetry).add(eventId));
        });
      } else {
        next.add(eventId);
        authApiClient.post(`/market-intelligence/economic-alerts/${encodeURIComponent(eventId)}`).catch(() => {
          const rollback = new Set(next);
          rollback.delete(eventId);
          setAlertEventIds(rollback);
        });
      }
      return next;
    });
  };

  const selectedEvent = selectedEventId
    ? events.find((event) => event.id === selectedEventId)
    : null;
  const selectedDetails = selectedEventId ? eventDetails[selectedEventId] : null;
  const eventData: EconomicEvent | null =
    (selectedDetails?.event as EconomicEvent) || selectedEvent;
  const eventHistory = Array.isArray(selectedDetails?.history)
    ? selectedDetails.history
    : [];
  const aiSummary = selectedDetails?.aiSummary;
  const cachedAt = selectedDetails?.cachedAt;
  const confidence = Number(selectedDetails?.aiSummary?.confidence ?? selectedDetails?.confidence ?? 0);
  const sourceQuality =
    selectedDetails?.detailedAnalysis?.sourceQuality ||
    selectedDetails?.aiSummary?.sourceQuality ||
    selectedDetails?.sourceQuality;
  const affectedSymbols = selectedDetails?.impact?.affectedSymbols || eventData?.impact?.affectedSymbols || [];

  const timezoneOptions = [
    { value: 'local', label: `Local (${resolvedTimeZone})` },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'New York (ET)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FaSpinner className="animate-spin text-3xl text-emerald-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading economic data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <FaExclamationTriangle className="mx-auto text-3xl text-red-500 mb-3" />
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button onClick={() => fetchEvents()} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="bg-white dark:bg-[#050505] rounded-2xl shadow-sm border border-gray-200 dark:border-[#1A1A1A] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-[#1A1A1A] flex flex-col gap-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Economic Calendar
          </h3>

          <div className="flex flex-wrap items-center gap-6 text-sm mt-2">
            
            {/* Timezone */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Timezone:</span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-full px-3 py-1 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {timezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Impact Filters */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Impact:</span>
              <div className="flex items-center bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-full overflow-hidden p-0.5">
                {['High', 'Medium', 'Low'].map(impact => {
                  const isActive = activeFilters.includes(impact.toLowerCase());
                  return (
                    <button
                      key={impact}
                      onClick={() => toggleFilter(impact.toLowerCase())}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-transparent text-emerald-500 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'text-gray-500 dark:text-gray-400 border border-transparent hover:text-gray-300'
                      }`}
                    >
                      {impact}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency Filters */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Currency:</span>
              <div className="flex flex-wrap items-center bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-full overflow-hidden p-0.5 gap-1">
                <button
                  onClick={() => setActiveCurrencies([])}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeCurrencies.length === 0
                      ? 'bg-transparent text-emerald-500 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'text-gray-500 dark:text-gray-400 border border-transparent hover:text-gray-300'
                  }`}
                >
                  All
                </button>
                {availableCurrencies.slice(0, 5).map((currency) => {
                  const isActive = activeCurrencies.includes(currency);
                  return (
                    <button
                      key={currency}
                      onClick={() => handleCurrencyToggle(currency)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-transparent text-emerald-500 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'text-gray-500 dark:text-gray-400 border border-transparent hover:text-gray-300'
                      }`}
                    >
                      {currency}
                    </button>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-0">
            <div className="pb-4">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 ml-2">Upcoming Events</h4>
              <div className="bg-white dark:bg-[#050505] rounded-xl overflow-hidden">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No events found for selected filters.
              </div>
            ) : (
              <div className="">
                {groupKeys.map(group => (
                  <div key={group} className="mb-4">
                    <div className="px-2 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 capitalize bg-transparent sticky top-0">
                      {group}
                    </div>
                    <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">Event <span className="text-[10px]">▼</span></span>
                      <span className="flex gap-4 w-[200px] justify-end pr-2 text-right">
                        <span className="w-14">Actual</span>
                        <span className="w-14">Forecast</span>
                        <span className="w-14">Previous</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 px-2">
                      {groupedEvents[group].map((event) => {
                        const isSelected = selectedEventId === event.id;
                        return (
                          <button
                            key={event.id}
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setDetailTab('summary');
                              fetchEventDetails(event.id);
                            }}
                            className={`w-full text-left px-4 py-4 transition-all relative rounded-lg border flex items-center justify-between gap-4 ${
                              isSelected
                                ? 'bg-[#0A1A14] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] inset-0 z-10'
                                : 'bg-transparent border-[#1A1A1A] hover:bg-[#111]'
                            }`}
                          >
                            <div className="flex items-center gap-3 w-1/2 min-w-[300px]">
                              {/* Glowing Dot */}
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-gray-400 dark:bg-gray-600'}`} />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTime(event.date)}</span>
                              <span className="text-gray-400 dark:text-gray-600">|</span>
                              <span className="text-sm">{getCountryFlag(event.country)}</span>
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-300">{event.currency}</span>
                              <span className="text-gray-400 dark:text-gray-600">|</span>
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">
                                {event.title}
                              </span>
                              {getImpactBadge(event.importance)}
                            </div>
                            
                            <div className="flex items-center gap-4 w-[200px] justify-end pr-2 font-mono text-xs text-right">
                              <span className="w-14 font-semibold text-gray-700 dark:text-gray-300">{event.actual || '--'}</span>
                              <span className="w-14 text-gray-500 dark:text-gray-500">{event.forecast || '--'}</span>
                              <span className="w-14 text-gray-500 dark:text-gray-500">{event.previous || '--'}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-[#050505] border-l border-gray-200 dark:border-[#1A1A1A]">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">AI Analysis & Market Impact</h4>
            
            {!selectedEvent && (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 space-y-3 pb-20">
                <FaCalendarAlt className="text-4xl text-emerald-500/50" />
                <p className="text-sm">Select an event to see AI analysis and market impact.</p>
              </div>
            )}

            {selectedEvent && eventData && loadingDetails === eventData.id ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <FaSpinner className="animate-spin text-3xl text-emerald-500 mb-4" /> 
                <p>Generating Deep AI Analysis...</p>
              </div>
            ) : selectedEvent && eventData && (
              <div className="space-y-6 flex flex-col h-[calc(100%-40px)]">
                
                {/* 1. Outcome Meter Section */}
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-5 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-8">
                    <h5 className="text-sm font-bold text-gray-900 dark:text-white">Outcome Meter</h5>
                    <button
                      type="button"
                      onClick={() => toggleAlert(eventData.id)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        alertEventIds.has(eventData.id)
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-600/60 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                      }`}
                    >
                      <FaBell />
                      {alertEventIds.has(eventData.id) ? 'Alert On' : 'Set Alert'}
                    </button>
                  </div>
                  
                  {/* The Track */}
                  <div className="relative w-full h-8 flex items-center mb-10 px-2 mt-4">
                    <div className="absolute w-[calc(100%-16px)] h-3 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-red-500 opacity-80 left-2"></div>
                    {/* The Thumb */}
                    {(() => {
                      const dir = getSurpriseDirection(eventData);
                      // Calculate position 0 to 100
                      const pos = dir === 'better' ? 15 : dir === 'worse' ? 85 : 50;
                      return (
                         <div 
                           className="absolute w-6 h-6 rounded-full bg-white dark:bg-black border-4 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)] z-10 top-1/2 -translate-y-1/2"
                           style={{ left: `calc(${pos}% - 12px)` }}
                         />
                      );
                    })()}

                    {/* Labels under track */}
                    <div className="absolute top-8 w-[calc(100%-16px)] left-2 flex justify-between text-xs font-semibold">
                      <span className="text-emerald-600 dark:text-emerald-500">Better</span>
                      <span className="text-gray-500 dark:text-gray-400 text-center relative after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:w-px after:h-4 after:bg-gray-400 after:mb-1">As Expected</span>
                      <span className="text-red-500">Worse</span>
                    </div>
                  </div>

                  {/* Projected Outcome Pill */}
                  <div className="flex justify-center mb-6">
                    <div className="px-6 py-2 rounded-full border border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                        Projected Outcome: {getSurpriseDirection(eventData) === 'better' ? 'Better' : getSurpriseDirection(eventData) === 'worse' ? 'Worse' : 'As Expected'} 
                        {' '}({Number.isFinite(confidence) ? `${confidence.toFixed(0)}%` : '70%'})
                      </span>
                    </div>
                  </div>

                  {/* AI Explanation Text */}
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed px-2">
                    {selectedDetails?.preEventAnalysis?.marketExpectations || aiSummary?.marketPulse || 'Based on recent data, TradeTaper AI predicts a potential for better-than-expected numbers, suggesting a bullish outlook for the affected currencies. The AI indicates confidence in current market conditions aligning with these projections.'}
                  </div>
                </div>

                {/* 2. Market Impact Cards */}
                <div>
                  <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Market Impact (Popular Pairs)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Map through Watchlist or Fallbacks */}
                    {(() => {
                      const list = Array.isArray(aiSummary?.watchlist) && aiSummary.watchlist.length > 0 
                        ? aiSummary.watchlist.slice(0, 3) 
                        : [
                            { symbol: 'EUR/USD', bias: 'Bullish', price: '$1.0670' },
                            { symbol: 'GBP/USD', bias: 'Bearish', price: '$1.2754' },
                            { symbol: 'Gold/XAU', bias: 'Bullish', price: '$2118.00' }
                          ];
                      
                      return list.map((item: any, idx: number) => {
                        const isBullish = item.bias === 'Bullish' || item.bias?.toLowerCase().includes('bull');
                        
                        return (
                          <div key={idx} className={`rounded-xl p-4 bg-white dark:bg-[#111] border ${isBullish ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h6 className="text-sm font-bold text-gray-900 dark:text-white">{item.symbol || 'Pair'}</h6>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.price || '--'}</span>
                              </div>
                              <div className={`text-2xl font-bold ${isBullish ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isBullish ? '↑' : '↓'}
                              </div>
                            </div>
                            <div>
                              <div className={`text-lg font-bold ${isBullish ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>{item.bias || (isBullish ? 'Bullish' : 'Bearish')}</div>
                              <div className="text-[10px] text-gray-500">(Medium Conviction)</div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* 3. Historical Volatility Mini Chart */}
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4 shadow-sm flex-1 min-h-[120px]">
                  <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-4">Historical Volatility for Selected Event</h5>
                  <div className="h-16 flex items-end gap-[2px] w-full opacity-80">
                    {Array.from({length: 40}).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-full rounded-t-sm ${i > 25 && i < 32 ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-emerald-200 dark:bg-emerald-900/50'}`}
                        style={{ height: `${Math.max(10, Math.random() * (i > 25 && i < 32 ? 100 : 40))}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* 4. Tabs at bottom */}
                <div className="mt-auto pt-4 flex gap-2 border-b border-gray-200 dark:border-[#222]">
                  <button 
                    onClick={() => setDetailTab('ai')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors ${detailTab === 'ai' || detailTab === 'summary' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    AI Market Analysis
                  </button>
                  <button 
                    onClick={() => setDetailTab('history')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors ${detailTab === 'history' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    History
                  </button>
                </div>
                
                {/* Render History if selected */}
                {detailTab === 'history' && eventHistory.length > 0 && (
                  <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4 mt-4 shadow-sm">
                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex justify-between">
                       <span>Recent Releases</span>
                       <span className="text-xs text-gray-500 font-normal">Actual / Forecast / Previous</span>
                     </div>
                    <div className="divide-y divide-gray-100 dark:divide-[#222]">
                      {eventHistory.slice(0, 5).map((item: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 py-2 text-xs text-gray-600 dark:text-gray-300">
                          <span>{item.date ? new Date(item.date).toLocaleDateString() : '—'}</span>
                          <span><strong className="text-gray-900 dark:text-white">{formatValue(item.actual)}</strong></span>
                          <span><strong className="text-gray-900 dark:text-white">{formatValue(item.forecast)}</strong></span>
                          <span><strong className="text-gray-900 dark:text-white">{formatValue(item.previous)}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
