/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/priceDataService.ts
import { authApiClient } from './api';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { format as formatDateFns } from 'date-fns';

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
        
        // Handle both forex symbol formats: NZD/USD (with slash) and NZDUSD (without slash)
        let symbolParts: string[];
        const upperSymbol = symbol.toUpperCase();
        
        if (upperSymbol.includes('/')) {
            // Format: NZD/USD
            symbolParts = upperSymbol.split('/');
        } else {
            // Format: NZDUSD - split into 3-letter currency codes
            if (upperSymbol.length === 6) {
                symbolParts = [upperSymbol.slice(0, 3), upperSymbol.slice(3, 6)];
            } else {
                throw new Error(`Invalid forex symbol format: ${symbol}. Expected format: BASE/QUOTE (e.g., NZD/USD) or BASEQUOTE (e.g., NZDUSD)`);
            }
        }
        
        if (symbolParts.length !== 2 || symbolParts[0].length !== 3 || symbolParts[1].length !== 3) {
            throw new Error(`Invalid forex symbol format: ${symbol}. Expected format: BASE/QUOTE (e.g., NZD/USD) or BASEQUOTE (e.g., NZDUSD)`);
        }
        
        const [baseCurrency, quoteCurrency] = symbolParts;
        const apiUrl = `/market-data/historical/forex/${baseCurrency}/${quoteCurrency}?${params.toString()}`;
        console.log('%c[FRONTEND - fetchRealPriceData] Converted symbol format:', 'color: blue;', {
            originalSymbol: symbol,
            baseCurrency,
            quoteCurrency,
            apiUrl
        });

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
        } else if (error.request) {
             console.error('%c[FRONTEND - fetchRealPriceData] Axios error: No response received, request was made.', 'color: red;', error.request);
        } else {
             console.error('%c[FRONTEND - fetchRealPriceData] Axios error: Error setting up request.', 'color: red;', error.message);
        }
        throw error;
    }
}