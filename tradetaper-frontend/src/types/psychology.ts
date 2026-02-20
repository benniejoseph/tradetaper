export interface PsychologicalInsight {
  id: string;
  insightType: string;
  sentiment: string;
  confidenceScore: number;
  extractedText: string;
  analysisDate: string;
}

export interface ProfileSummary {
  totalInsights: number;
  insightTypeCounts: Record<string, number>;
  sentimentCounts: Record<string, number>;
  averageConfidence: number;
}
