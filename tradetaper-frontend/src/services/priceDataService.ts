/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/priceDataService.ts
import { authApiClient } from './api';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { format as formatDateFns } from 'date-fns';
import { classifySymbol, getApiEndpointForSymbol } from '@/utils/symbolClassification';

interface ApiPriceDataPoint {
    time: number; // UNIX timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export async function fetchRealPriceData(
    symbol: string,
    fromDateObj: Date,
    toDateObj: Date,
    interval: string,
): Promise<CandlestickData[]> {
    const startDateStr = formatDateFns(fromDateObj, 'yyyy-MM-dd');
    const endDateStr = formatDateFns(toDateObj, 'yyyy-MM-dd');

    // ADD DETAILED LOGGING HERE
   console.log('%c[FRONTEND - fetchRealPriceData] Sending request to backend with:', 'color: blue; font-weight: bold;', {
        rawSymbol: symbol,
        rawFromDateObj: fromDateObj,
        rawToDateObj: toDateObj,
        rawInterval: interval,
        processedSymbol: symbol?.toUpperCase(), // What's actually sent in path
        processedStartDate: startDateStr,
        processedEndDate: endDateStr,
        processedInterval: interval?.toLowerCase(), // What's actually sent in query
    });

    try {
        const params = new URLSearchParams({
            startDate: startDateStr,
            endDate: endDateStr,
            interval: interval,
        });
        
        // Use symbol classification to determine correct API endpoint
        const classification = classifySymbol(symbol);
        let apiUrl: string;
        
        // Temporary fix: if the symbol is a known commodity but backend doesn't have commodity endpoints yet,
        // use forex endpoint with proper currency splitting for precious metals
        if (classification.assetType === 'commodities' && symbol.toUpperCase().startsWith('XAU')) {
            // Handle XAUUSD as XAU/USD in forex endpoint temporarily
            const apiEndpoint = `/market-data/historical/forex/XAU/USD`;
            apiUrl = `${apiEndpoint}?${params.toString()}`;
            console.log('%c[FRONTEND - fetchRealPriceData] Using forex endpoint for commodity (temporary):', 'color: orange; font-weight: bold;', {
                originalSymbol: symbol,
                assetType: 'commodities (using forex endpoint)',
                apiEndpoint,
                apiUrl
            });
        } else {
            try {
                const apiEndpoint = getApiEndpointForSymbol(symbol);
                apiUrl = `${apiEndpoint}?${params.toString()}`;
                console.log('%c[FRONTEND - fetchRealPriceData] Symbol classification:', 'color: green; font-weight: bold;', {
                    originalSymbol: symbol,
                    assetType: classification.assetType,
                    description: classification.description,
                    apiEndpoint,
                    apiUrl
                });
            } catch (error) {
                // Fallback to old forex logic if classification fails
                const upperSymbol = symbol.toUpperCase();
                let symbolParts: string[];
                
                if (upperSymbol.includes('/')) {
                    symbolParts = upperSymbol.split('/');
                } else if (upperSymbol.length === 6) {
                    symbolParts = [upperSymbol.slice(0, 3), upperSymbol.slice(3, 6)];
                } else {
                    throw new Error(`Unable to classify symbol: ${symbol}`);
                }
                
                const [baseCurrency, quoteCurrency] = symbolParts;
                apiUrl = `/market-data/historical/forex/${baseCurrency}/${quoteCurrency}?${params.toString()}`;
                console.log('%c[FRONTEND - fetchRealPriceData] Fallback to forex format:', 'color: orange;', {
                    originalSymbol: symbol,
                    baseCurrency,
                    quoteCurrency,
                    apiUrl
                });
            }
        }

        const response = await authApiClient.get<ApiPriceDataPoint[]>(apiUrl);

        if (!response.data) {
            console.warn("[fetchRealPriceData] No data received from backend for symbol:", symbol);
            return [];
        }
        
        return response.data.map(d => ({
            time: d.time as UTCTimestamp,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

    } catch (error: any) {
        console.error('%c[FRONTEND - fetchRealPriceData] Axios Error:', 'color: red; font-weight: bold;', error);
        if (error.isAxiosError && error.response) {
            console.error('%c[FRONTEND - fetchRealPriceData] Axios error.response.data:', 'color: red;', error.response.data);
            console.error('%c[FRONTEND - fetchRealPriceData] Axios error.response.status:', 'color: red;', error.response.status);
            console.error('%c[FRONTEND - fetchRealPriceData] Axios error.response.headers:', 'color: red;', error.response.headers);
            
            // Add specific handling for common API limitation errors
            if (error.response.status === 403 || error.response.status === 400) {
                const errorMessage = error.response.data?.message || error.response.data?.error || 'API access limitation';
                console.warn('%c[FRONTEND - fetchRealPriceData] API Limitation detected:', 'color: orange;', errorMessage);
                
                if (errorMessage.includes('one month history') || errorMessage.includes('working days')) {
                    console.info('%c[FRONTEND - fetchRealPriceData] Suggestion: Try using daily interval or shorter date range', 'color: blue;');
                }
            }
        } else if (error.request) {
             console.error('%c[FRONTEND - fetchRealPriceData] Axios error: No response received, request was made.', 'color: red;', error.request);
        } else {
             console.error('%c[FRONTEND - fetchRealPriceData] Axios error: Error setting up request.', 'color: red;', error.message);
        }
        throw error;
    }
}