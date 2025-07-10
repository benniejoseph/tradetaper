import { User } from './user.entity';
export declare class Account {
    id: string;
    userId: string;
    name: string;
    balance: number;
    currency: string;
    description: string;
    isActive: boolean;
    target: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
