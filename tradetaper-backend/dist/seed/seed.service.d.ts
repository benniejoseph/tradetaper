import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
export declare class SeedService implements OnApplicationBootstrap {
    private readonly userRepository;
    private readonly tradeRepository;
    private readonly usersService;
    private readonly configService;
    private readonly logger;
    private readonly TRADING_ACCOUNTS;
    constructor(userRepository: Repository<User>, tradeRepository: Repository<Trade>, usersService: UsersService, configService: ConfigService);
    onApplicationBootstrap(): Promise<void>;
    private seedUsersAndTrades;
    private calculateTradeMetrics;
    private generateTradesForAccount;
    private generateSetupDetails;
    private generateLessons;
    private generateMistakes;
}
