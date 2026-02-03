import { TradingSession } from '../../types/enums';
export interface ChecklistItem {
    id: string;
    text: string;
    completed?: boolean;
    order: number;
}
export declare class Strategy {
    id: string;
    name: string;
    description: string;
    checklist: ChecklistItem[];
    tradingSession: TradingSession;
    isActive: boolean;
    maxRiskPercent: number;
    color: string;
    tags: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}
