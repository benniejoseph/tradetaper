export interface CreatePredictionDto {
  instrument: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  expectedDurationHours?: number;
}

export interface PredictionResult {
  predictedOutcome: 'win' | 'loss';
  confidenceScore: number;
  predictedExitPrice?: number;
  predictedDurationMinutes?: number;
} 