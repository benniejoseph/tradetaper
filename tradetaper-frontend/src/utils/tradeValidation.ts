import { CreateTradePayload, UpdateTradePayload, TradeDirection } from '@/types/trade';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateTradeData = (data: CreateTradePayload | UpdateTradePayload): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required field validations
  if (!data.symbol || data.symbol.trim() === '') {
    errors.push({ field: 'symbol', message: 'Symbol is required' });
  }

  if (!data.entryDate) {
    errors.push({ field: 'entryDate', message: 'Entry date is required' });
  }

  if (!data.entryPrice || data.entryPrice <= 0) {
    errors.push({ field: 'entryPrice', message: 'Entry price must be greater than 0' });
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be greater than 0' });
  }

  // Business logic validations
  if (data.exitDate && data.entryDate) {
    const entryDate = new Date(data.entryDate);
    const exitDate = new Date(data.exitDate);
    
    if (exitDate < entryDate) {
      errors.push({ field: 'exitDate', message: 'Exit date cannot be before entry date' });
    }
  }

  if (data.exitPrice && data.entryPrice) {
    if (data.direction === TradeDirection.LONG && data.exitPrice < 0) {
      errors.push({ field: 'exitPrice', message: 'Exit price must be positive' });
    }
    if (data.direction === TradeDirection.SHORT && data.exitPrice < 0) {
      errors.push({ field: 'exitPrice', message: 'Exit price must be positive' });
    }
  }

  if (data.stopLoss && data.entryPrice) {
    if (data.direction === TradeDirection.LONG && data.stopLoss >= data.entryPrice) {
      errors.push({ field: 'stopLoss', message: 'Stop loss should be below entry price for long positions' });
    }
    if (data.direction === TradeDirection.SHORT && data.stopLoss <= data.entryPrice) {
      errors.push({ field: 'stopLoss', message: 'Stop loss should be above entry price for short positions' });
    }
  }

  if (data.takeProfit && data.entryPrice) {
    if (data.direction === TradeDirection.LONG && data.takeProfit <= data.entryPrice) {
      errors.push({ field: 'takeProfit', message: 'Take profit should be above entry price for long positions' });
    }
    if (data.direction === TradeDirection.SHORT && data.takeProfit >= data.entryPrice) {
      errors.push({ field: 'takeProfit', message: 'Take profit should be below entry price for short positions' });
    }
  }

  if (data.commission && data.commission < 0) {
    errors.push({ field: 'commission', message: 'Commission cannot be negative' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getFieldError = (errors: ValidationError[], fieldName: string): string | undefined => {
  const error = errors.find(err => err.field === fieldName);
  return error?.message;
}; 