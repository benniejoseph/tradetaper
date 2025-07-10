import { User } from '../../users/entities/user.entity';
export declare class Usage {
    id: string;
    userId: string;
    user: User;
    trades: number;
    accounts: number;
    periodStart: Date;
    periodEnd: Date;
    createdAt: Date;
    updatedAt: Date;
}
