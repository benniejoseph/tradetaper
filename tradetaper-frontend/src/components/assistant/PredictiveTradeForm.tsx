'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { predictiveTradesService } from '@/services/predictive-trades.service';

interface Prediction {
  probabilityOfProfit: number;
  expectedPnL: { min: number; max: number };
  predictedOutcome: 'win' | 'loss' | 'neutral';
  confidence: number;
}

const PredictiveTradeForm: React.FC = () => {
  const [instrument, setInstrument] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await predictiveTradesService.predict({
        instrument,
        direction,
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
      });
      setPrediction(response);
    } catch (err) {
      setError('Failed to get prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Trade Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrument</Label>
              <Input
                id="instrument"
                value={instrument}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInstrument(e.target.value)}
                placeholder="e.g., EURUSD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select
                onValueChange={(value: 'buy' | 'sell') => setDirection(value)}
                defaultValue={direction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                type="number"
                value={entryPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntryPrice(e.target.value)}
                placeholder="e.g., 1.0850"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                type="number"
                value={stopLoss}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStopLoss(e.target.value)}
                placeholder="e.g., 1.0820"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input
                id="takeProfit"
                type="number"
                value={takeProfit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTakeProfit(e.target.value)}
                placeholder="e.g., 1.0920"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Get Prediction'}
          </Button>
        </form>

        {error && <p className="mt-4 text-red-500">{error}</p>}

        {prediction && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">Prediction Result</h3>
            <p>
              <strong>Outcome:</strong> {prediction.predictedOutcome}
            </p>
            <p>
              <strong>Probability of Profit:</strong>{' '}
              {(prediction.probabilityOfProfit * 100).toFixed(2)}%
            </p>
            <p>
              <strong>Expected P&L:</strong> ${prediction.expectedPnL.min} - $
              {prediction.expectedPnL.max}
            </p>
            <p>
              <strong>Confidence:</strong>{' '}
              {(prediction.confidence * 100).toFixed(2)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveTradeForm; 