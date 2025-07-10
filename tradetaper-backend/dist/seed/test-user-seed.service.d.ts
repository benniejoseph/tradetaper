import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { MT5Account } from '../users/entities/mt5-account.entity';
import { Strategy } from '../strategies/entities/strategy.entity';
export declare class TestUserSeedService {
    private readonly userRepository;
    private readonly tradeRepository;
    private readonly tagRepository;
    private readonly mt5AccountRepository;
    private readonly strategyRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>, tradeRepository: Repository<Trade>, tagRepository: Repository<Tag>, mt5AccountRepository: Repository<MT5Account>, strategyRepository: Repository<Strategy>);
    createTestUser(): Promise<{
        user: User;
        stats: {
            trades: number;
            accounts: number;
            strategies: number;
            tags: number;
        };
    }>;
    private createMT5Accounts;
    private createStrategies;
    private createTags;
    private createTrades;
    deleteTestUser(): Promise<void>;
}
