
// src/services/tradesApi.ts
import { api } from './api';

// Placeholder for the response DTO from the backend
export interface AnalyzeChartResponseDto {
  symbol?: string;
  direction?: 'Long' | 'Short';
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

/**
 * Uploads a chart image for analysis.
 * @param file The image file to upload.
 * @returns A promise that resolves to the analysis results.
 */
export const uploadChartForAnalysis = async (file: File): Promise<AnalyzeChartResponseDto> => {
  const formData = new FormData();
  formData.append('file', file);

  // This endpoint does not exist yet and will fail until the L3A1 backend work is complete.
  const response = await api.post<AnalyzeChartResponseDto>('/trades/analyze-chart', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
