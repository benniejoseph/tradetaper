import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaSpinner, FaExclamationTriangle, FaChevronDown, FaChevronUp, FaFilter } from 'react-icons/fa';
import { authApiClient } from '@/services/api';

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: string; // ISO string
  time: string; // Original time string
  importance: 'low' | 'medium' | 'high';
  actual?: string | number;
  forecast?: string | number;
  previous?: string | number;
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
  const [activeFilters, setActiveFilters] = useState<string[]>(['high', 'medium', 'low']);
  
  // Expansion
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApiClient.get('/market-intelligence/economic-calendar');
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

  const toggleExpansion = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      fetchEventDetails(eventId);
    }
  };

  const toggleFilter = (impact: string) => {
    setActiveFilters(prev => 
      prev.includes(impact) 
        ? prev.filter(f => f !== impact)
        : [...prev, impact]
    );
  };

  const formatIST = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
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
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
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

  // 1. Filter
  const filteredEvents = events.filter(e => activeFilters.includes(e.importance.toLowerCase()));

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
        <button onClick={fetchEvents} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <FaCalendarAlt className="mr-2 text-emerald-600" />
            Economic Calendar
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">Timezone: IST (Asia/Kolkata)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          {['High', 'Medium', 'Low'].map(impact => (
            <button
              key={impact}
              onClick={() => toggleFilter(impact.toLowerCase())}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                activeFilters.includes(impact.toLowerCase())
                  ? getImpactColor(impact)
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
            >
              {impact}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No events found for selected filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupKeys.map(group => (
              <div key={group}>
                <div className="bg-gray-100 dark:bg-gray-800/80 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide sticky top-0">
                  {group}
                </div>
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {groupedEvents[group].map((event) => (
                      <React.Fragment key={event.id}>
                        <tr 
                          onClick={() => toggleExpansion(event.id)}
                          className={`cursor-pointer transition-colors ${
                            expandedEventId === event.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap w-24">
                            {formatIST(event.date)}
                          </td>
                          <td className="px-4 py-3 w-16">
                            <span className="text-gray-700 dark:text-gray-300 font-bold">{event.currency}</span>
                          </td>
                          <td className="px-4 py-3 w-24">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${getImpactColor(event.importance)} capitalize inline-block text-center w-full`}>
                              {event.importance}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </td>
                           <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                            {event.actual || '-'}
                          </td>
                          <td className="px-4 py-3 text-right w-10">
                            {expandedEventId === event.id ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                          </td>
                        </tr>
                        {expandedEventId === event.id && (
                           <tr>
                             <td colSpan={7} className="px-0 py-0 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                               <div className="p-4 space-y-4">
                                 {loadingDetails === event.id ? (
                                    <div className="flex items-center justify-center p-6 text-gray-500">
                                      <FaSpinner className="animate-spin mr-2" /> Generating AI Analysis...
                                    </div>
                                 ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      {/* Left Column: Specs like Image 0 */}
                                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden text-sm">
                                         <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                                           Specs
                                         </div>
                                         <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {[
                                              { label: 'Source', value: eventDetails[event.id]?.detailedAnalysis?.source || 'N/A' },
                                              { label: 'Measures', value: eventDetails[event.id]?.detailedAnalysis?.measures || event.description },
                                              { label: 'Usual Effect', value: eventDetails[event.id]?.detailedAnalysis?.usualEffect || 'Actual > Forecast = Good for Currency' },
                                              { label: 'Frequency', value: eventDetails[event.id]?.detailedAnalysis?.frequency || 'Monthly' }, 
                                              { label: 'Next Release', value: eventDetails[event.id]?.detailedAnalysis?.nextRelease || 'TBA' },
                                              { label: 'Why Traders Care', value: eventDetails[event.id]?.detailedAnalysis?.whyTradersCare || 'Significant market impact' }
                                            ].map((item, idx) => (
                                              <div key={idx} className="flex">
                                                <div className="w-1/3 bg-gray-50 dark:bg-gray-800/80 px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700">
                                                  {item.label}
                                                </div>
                                                <div className="w-2/3 px-3 py-2 text-gray-800 dark:text-gray-200">
                                                  {item.value}
                                                </div>
                                              </div>
                                            ))}
                                         </div>
                                      </div>

                                      {/* Right Column: AI Analysis & Trading Recs */}
                                      <div className="space-y-4">
                                         <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-md p-4">
                                           <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2">Market Expectations</h4>
                                           <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                                              {eventDetails[event.id]?.preEventAnalysis?.marketExpectations || "Analysis loading..."}
                                           </p>
                                         </div>

                                         {eventDetails[event.id]?.tradingRecommendations && (
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800">
                                               <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">Trading Recommendations</h4>
                                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                  <div>
                                                     <span className="font-semibold block mb-1 text-gray-500">Pre-Event</span>
                                                     <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-300">
                                                        {eventDetails[event.id].tradingRecommendations.preEvent?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                                     </ul>
                                                  </div>
                                                  <div>
                                                     <span className="font-semibold block mb-1 text-gray-500">Post-Event</span>
                                                     <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-300">
                                                        {eventDetails[event.id].tradingRecommendations.postEvent?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                                     </ul>
                                                  </div>
                                               </div>
                                            </div>
                                         )}
                                      </div>
                                    </div>
                                 )}
                               </div>
                             </td>
                           </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

