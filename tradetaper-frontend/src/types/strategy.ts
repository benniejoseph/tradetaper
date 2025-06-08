export interface ChecklistItem {
  id: string;
  text: string;
  completed?: boolean;
  order: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  checklist: ChecklistItem[];
  tradingSession: 'london' | 'newyork' | 'asia' | 'sydney' | null;
  isActive: boolean;
  color: string;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  stats?: StrategyStats;
}

export interface StrategyStats {
  totalTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
}

export interface CreateStrategyDto {
  name: string;
  description?: string;
  checklist?: ChecklistItem[];
  tradingSession?: 'london' | 'newyork' | 'asia' | 'sydney';
  isActive?: boolean;
  color?: string;
  tags?: string;
}

export interface UpdateStrategyDto extends Partial<CreateStrategyDto> {}