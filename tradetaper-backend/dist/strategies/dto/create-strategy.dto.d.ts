import { TradingSession } from '../../types/enums';
import { ChecklistItem } from '../entities/strategy.entity';
export declare class CreateStrategyDto {
    name: string;
    description?: string;
    checklist?: ChecklistItem[];
    tradingSession?: TradingSession;
    isActive?: boolean;
    color?: string;
    tags?: string;
}
