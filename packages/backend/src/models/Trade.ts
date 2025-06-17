import mongoose, { Schema, Document } from 'mongoose';
import { Trade as TradeDTO } from '@tradetaper/shared-dto';

// Extend the Trade DTO with Mongoose Document
export interface TradeDocument extends TradeDTO, Document {}

const TradeSchema = new Schema<TradeDocument>({
  symbol: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  direction: { type: String, enum: ['LONG', 'SHORT'], required: true },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date, required: true },
  pnl: { type: Number, required: true },
  pnlPercentage: { type: Number, required: true },
  strategy: { type: String, required: true },
  notes: { type: String },
  tags: [{ type: String }],
  screenshots: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
TradeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Trade = mongoose.model<TradeDocument>('Trade', TradeSchema); 