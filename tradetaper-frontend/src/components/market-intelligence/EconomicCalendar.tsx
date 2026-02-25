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
    <div className="space-y-4">
      <div className="bg-white dark:bg-black/70 rounded-2xl shadow-sm border border-gray-200 dark:border-emerald-900/40 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-emerald-900/40 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-gray-50 dark:bg-black/60">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <FaCalendarAlt className="mr-2 text-emerald-600" />
              Economic Calendar
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Timezone: {resolvedTimeZone}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, currency, country"
                className="pl-8 pr-3 py-2 rounded-full text-xs border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 text-gray-700 dark:text-gray-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400 text-xs" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="rounded-full border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 text-xs text-gray-600 dark:text-gray-300 px-3 py-2"
              >
                {timezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400 text-xs" />
              {(['today', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    dateRange === range
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-gray-100 dark:bg-black/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-emerald-900/40'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400 text-xs" />
              {['High', 'Medium', 'Low'].map(impact => (
                <button
                  key={impact}
                  onClick={() => toggleFilter(impact.toLowerCase())}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    activeFilters.includes(impact.toLowerCase())
                      ? getImpactColor(impact)
                      : 'bg-gray-100 dark:bg-black/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-emerald-900/40'
                  }`}
                >
                  {impact}
                </button>
              ))}
            </div>
          </div>
        </div>

        {availableCurrencies.length > 0 && (
          <div className="px-4 pb-4 pt-3 border-b border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 flex flex-wrap gap-2">
            {availableCurrencies.map((currency) => (
              <button
                key={currency}
                onClick={() => handleCurrencyToggle(currency)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  activeCurrencies.includes(currency)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-100 dark:bg-black/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-emerald-900/40'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-0">
          <div className="border-r border-gray-200 dark:border-emerald-900/40">
            {nextHighImpact && (
              <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase text-emerald-600 dark:text-emerald-300 font-semibold tracking-widest">Next High Impact</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{nextHighImpact.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {nextHighImpact.currency} • {formatTime(nextHighImpact.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEventId(nextHighImpact.id);
                      setDetailTab('summary');
                      fetchEventDetails(nextHighImpact.id);
                    }}
                    className="rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5"
                  >
                    View
                  </button>
                </div>
              </div>
            )}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No events found for selected filters.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-emerald-900/30">
                {groupKeys.map(group => (
                  <div key={group}>
                    <div className="bg-gray-100 dark:bg-black/60 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide sticky top-0">
                      {group}
                    </div>
                    <div className="px-4 py-2 text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-white dark:bg-black/70 border-b border-gray-200 dark:border-emerald-900/40 flex items-center justify-between">
                      <span>Event</span>
                      <span className="flex gap-10">
                        <span>Actual</span>
                        <span>Forecast</span>
                        <span>Previous</span>
                      </span>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-emerald-900/30">
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
                            className={`w-full text-left px-4 py-3 transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                : 'bg-white dark:bg-black/70 hover:bg-gray-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-semibold text-gray-900 dark:text-white">{formatTime(event.date)}</span>
                                  <span>{getCountryFlag(event.country)}</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{event.currency}</span>
                                  {getImpactBadge(event.importance)}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {event.title}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAlert(event.id);
                                  }}
                                  className={`flex items-center gap-1 text-[11px] font-semibold ${
                                    alertEventIds.has(event.id) ? 'text-emerald-600' : 'text-gray-400'
                                  }`}
                                >
                                  <FaBell />
                                  {alertEventIds.has(event.id) ? 'Alert' : 'Remind'}
                                </button>
                                <div className="grid grid-cols-3 gap-4 text-xs font-mono text-gray-500 dark:text-gray-400 min-w-[220px]">
                                  <span>{event.actual || '-'}</span>
                                  <span>{event.forecast || '-'}</span>
                                  <span>{event.previous || '-'}</span>
                                </div>
                              </div>
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

          <div className="p-4 bg-white dark:bg-black/70">
            {!selectedEvent && (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 space-y-3">
                <FaCalendarAlt className="text-3xl text-emerald-500" />
                <p className="text-sm">Select an event to see AI analysis and specs.</p>
              </div>
            )}

            {selectedEvent && eventData && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 dark:border-emerald-900/40 bg-gray-50 dark:bg-black/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-emerald-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">{formatTime(eventData.date)}</span>
                      <span>{getCountryFlag(eventData.country)}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{eventData.currency}</span>
                      {getImpactBadge(eventData.importance)}
                    </div>
                    <div className="flex items-center gap-2">
                      {cachedAt && (
                        <span className="text-[10px] text-gray-400">
                          Cached {new Date(cachedAt).toLocaleString()}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleAlert(eventData.id)}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          alertEventIds.has(eventData.id)
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-600/60 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'border-gray-200 text-gray-500 dark:border-emerald-900/40 dark:text-emerald-200/70'
                        }`}
                      >
                        <FaBell />
                        {alertEventIds.has(eventData.id) ? 'Alert On' : 'Set Alert'}
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4 space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {eventData.title}
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg bg-white dark:bg-black/60 border border-gray-200 dark:border-emerald-900/40 p-3">
                        <p className="text-[11px] uppercase text-gray-400">Actual</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{formatValue(eventData.actual)}</p>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-black/60 border border-gray-200 dark:border-emerald-900/40 p-3">
                        <p className="text-[11px] uppercase text-gray-400">Forecast</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{formatValue(eventData.forecast)}</p>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-black/60 border border-gray-200 dark:border-emerald-900/40 p-3">
                        <p className="text-[11px] uppercase text-gray-400">Previous</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{formatValue(eventData.previous)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      {eventData.category && <span className="rounded-full border border-gray-200 dark:border-emerald-900/40 px-2 py-1">Category: {eventData.category}</span>}
                      {eventData.unit && <span className="rounded-full border border-gray-200 dark:border-emerald-900/40 px-2 py-1">Unit: {eventData.unit}</span>}
                      {(eventData.source || eventData.sourceUrl) && (
                        <span className="rounded-full border border-gray-200 dark:border-emerald-900/40 px-2 py-1">
                          Source: {eventData.source || 'Official'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(['summary', 'ai', 'history'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDetailTab(tab)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        detailTab === tab
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-gray-100 dark:bg-black/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-emerald-900/40'
                      }`}
                    >
                      {tab === 'summary' ? 'Event Summary' : tab === 'ai' ? 'AI Market Analysis' : 'History'}
                    </button>
                  ))}
                </div>

                {loadingDetails === eventData.id ? (
                  <div className="flex items-center justify-center p-6 text-gray-500">
                    <FaSpinner className="animate-spin mr-2" /> Generating AI Analysis...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {detailTab === 'summary' && (
                      <>
                        <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-emerald-900/40 rounded-md overflow-hidden text-sm">
                          <div className="bg-gray-100 dark:bg-emerald-950/40 px-3 py-2 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-emerald-900/40">
                            Event Summary
                          </div>
                          <div className="p-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {selectedDetails?.detailedAnalysis?.summary || eventData.description || 'No summary available for this release.'}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-emerald-900/40 rounded-md overflow-hidden text-sm">
                          <div className="bg-gray-100 dark:bg-emerald-950/40 px-3 py-2 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-emerald-900/40">
                            Release Details
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-emerald-900/30">
                            {[
                              { label: 'Measures', value: selectedDetails?.detailedAnalysis?.measures || eventData.description },
                              { label: 'Category', value: selectedDetails?.detailedAnalysis?.category || eventData.category },
                              { label: 'Frequency', value: selectedDetails?.detailedAnalysis?.frequency || eventData.frequency || 'Monthly' },
                              { label: 'Reference', value: selectedDetails?.detailedAnalysis?.reference || eventData.reference },
                              { label: 'Reference Date', value: selectedDetails?.detailedAnalysis?.referenceDate || eventData.referenceDate },
                              { label: 'Ticker', value: selectedDetails?.detailedAnalysis?.ticker || eventData.ticker },
                              { label: 'Next Release', value: selectedDetails?.detailedAnalysis?.nextRelease || 'TBA' },
                              { label: 'Unit', value: selectedDetails?.detailedAnalysis?.unit || eventData.unit },
                              { label: 'Revised', value: selectedDetails?.detailedAnalysis?.revised || eventData.revised },
                              { label: 'Usual Effect', value: selectedDetails?.detailedAnalysis?.usualEffect },
                              { label: 'Why Traders Care', value: selectedDetails?.detailedAnalysis?.whyTradersCare },
                            ].map((item, idx) => (
                              <div key={idx} className="flex">
                                <div className="w-1/3 bg-gray-50 dark:bg-black/70 px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-emerald-900/40">
                                  {item.label}
                                </div>
                                <div className="w-2/3 px-3 py-2 text-gray-800 dark:text-gray-200">
                                  {formatValue(item.value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {detailTab === 'ai' && (
                      <>
                        <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-emerald-900/40 rounded-md overflow-hidden text-sm">
                          <div className="bg-gray-100 dark:bg-emerald-950/40 px-3 py-2 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-emerald-900/40">
                            AI Market Analysis
                          </div>
                          <div className="p-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {selectedDetails?.preEventAnalysis?.marketExpectations || aiSummary?.marketPulse || 'Analysis loading...'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-emerald-900/40 rounded-lg p-4">
                            <h5 className="text-xs font-bold text-gray-600 dark:text-gray-200 uppercase mb-2">Confidence</h5>
                            <p className="text-2xl font-bold text-emerald-600">{Number.isFinite(confidence) ? `${confidence.toFixed(0)}%` : '—'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Based on current macro context and release history.
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-emerald-900/40 rounded-lg p-4">
                            <h5 className="text-xs font-bold text-gray-600 dark:text-gray-200 uppercase mb-2">Source Quality</h5>
                            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                              <p>High: {sourceQuality?.high ?? '—'}</p>
                              <p>Medium: {sourceQuality?.medium ?? '—'}</p>
                              <p>Low: {sourceQuality?.low ?? '—'}</p>
                              <p>Consensus: {sourceQuality?.consensus || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {selectedDetails?.tradingRecommendations && (
                          <div className="border border-gray-200 dark:border-emerald-900/40 rounded-md p-4 bg-white dark:bg-black/70">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">Trading Recommendations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-semibold block mb-1 text-gray-500">Pre-Event</span>
                                <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-300">
                                  {selectedDetails.tradingRecommendations.preEvent?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                              <div>
                                <span className="font-semibold block mb-1 text-gray-500">Post-Event</span>
                                <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-300">
                                  {selectedDetails.tradingRecommendations.postEvent?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(Array.isArray(aiSummary?.watchlist) ? aiSummary.watchlist : affectedSymbols).slice(0, 6).map((item: any, idx: number) => (
                            <div key={idx} className="rounded-lg border border-gray-200 dark:border-emerald-900/40 p-3 bg-white dark:bg-black/70">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.symbol || item}</span>
                                <span className={`text-[10px] uppercase ${item.bias === 'Bearish' ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {item.bias || 'Neutral'}
                                </span>
                              </div>
                              {Array.isArray(item.drivers) && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                  {item.drivers.join(' • ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {aiSummary && (
                          <div className="border border-emerald-200 dark:border-emerald-800/60 rounded-md p-4 bg-emerald-50/50 dark:bg-emerald-950/40">
                            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase mb-2">High-Impact Briefing</h4>
                            <p className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
                              {aiSummary.headline}
                            </p>
                            <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-2">
                              {aiSummary.marketPulse}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {detailTab === 'history' && eventHistory.length > 0 && (
                      <div className="border border-gray-200 dark:border-emerald-900/40 rounded-md overflow-hidden bg-white dark:bg-black/70 text-sm">
                        <div className="bg-gray-100 dark:bg-emerald-950/40 px-3 py-2 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-emerald-900/40">
                          Recent Releases
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-emerald-900/30">
                          {eventHistory.slice(0, 6).map((item: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</span>
                              <span>Actual: {formatValue(item.actual)}</span>
                              <span>Forecast: {formatValue(item.forecast)}</span>
                              <span>Previous: {formatValue(item.previous)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailTab === 'ai' && Array.isArray(aiSummary?.topMovers) && aiSummary.topMovers.length > 0 && (
                      <div className="border border-gray-200 dark:border-emerald-900/40 rounded-md p-4 bg-white dark:bg-black/70">
                        <h4 className="text-xs font-bold text-gray-600 dark:text-emerald-300 uppercase mb-2">Top Movers Today</h4>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          {aiSummary.topMovers.map((mover: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{mover.symbol}</span>
                              <span className={mover.changePercent > 0 ? 'text-emerald-600' : mover.changePercent < 0 ? 'text-red-500' : 'text-gray-400'}>
                                {mover.changePercent?.toFixed?.(2) ?? mover.changePercent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailTab === 'summary' && (
                      <div className="border border-gray-200 dark:border-emerald-900/40 rounded-md bg-white dark:bg-black/70 p-4">
                        <h4 className="text-xs font-bold text-gray-600 dark:text-emerald-300 uppercase mb-3">Outcome Meter</h4>
                        <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-center">
                          {['better', 'worse', 'neutral'].map((key) => {
                            const isActive = getSurpriseDirection(eventData) === key;
                            const label = key === 'better' ? 'Better' : key === 'worse' ? 'Worse' : 'As Expected';
                            return (
                              <div
                                key={key}
                                className={`rounded-full py-1 border ${
                                  isActive
                                    ? key === 'better'
                                      ? 'bg-emerald-500 text-white border-emerald-500'
                                      : key === 'worse'
                                        ? 'bg-red-500 text-white border-red-500'
                                        : 'bg-gray-500 text-white border-gray-500'
                                    : 'bg-gray-100 dark:bg-black/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-emerald-900/40'
                                }`}
                              >
                                {label}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                          Outcome is based on Actual vs Forecast surprise.
                        </p>
                      </div>
                    )}
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
