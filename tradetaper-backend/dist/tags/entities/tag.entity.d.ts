import { User } from '../../users/entities/user.entity';
import { Trade } from '../../trades/entities/trade.entity';
export declare class Tag {
    id: string;
    name: string;
    user: User;
    userId: string;
    color?: string;
    trades: Trade[];
    createdAt: Date;
    updatedAt: Date;
}
