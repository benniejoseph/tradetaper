/**
 * Psychology API service for the frontend.
 * Connects to /api/v1/notes/:noteId/psychological-insights endpoints.
 */
import apiClient from '@/services/api';

export interface PsychologicalInsight {
  id: string;
  noteId: string;
  insightType: string;
  sentiment: string;
  confidenceScore: number;
  extractedText: string;
  analysisDate: string;
}

export interface PsychologyProfile {
  insights: PsychologicalInsight[];
  summary: {
    totalInsights: number;
    insightTypeCounts: Record<string, number>;
    sentimentCounts: Record<string, number>;
    averageConfidence: number;
  };
}

/** Trigger AI analysis for a specific note */
export const analyzeNote = async (noteId: string): Promise<PsychologicalInsight[]> => {
  const res = await apiClient.post(`/notes/${noteId}/psychological-insights/analyze`);
  return res.data;
};

/** Fetch existing insights for a specific note */
export const getNoteInsights = async (noteId: string): Promise<PsychologicalInsight[]> => {
  const res = await apiClient.get(`/notes/${noteId}/psychological-insights`);
  return res.data;
};

/** Fetch the aggregated psychological profile summary */
export const getProfileSummary = async (): Promise<PsychologyProfile['summary']> => {
  const res = await apiClient.get('/psychological-profile/summary');
  return res.data;
};

/** Fetch all insights (optionally filtered by date range) */
export const getAllInsights = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<PsychologicalInsight[]> => {
  const res = await apiClient.get('/psychological-profile', { params });
  return res.data;
};
