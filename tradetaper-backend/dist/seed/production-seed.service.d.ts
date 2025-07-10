import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { ConfigService } from '@nestjs/config';
export declare class ProductionSeedService {
    private readonly userRepository;
    private readonly subscriptionRepository;
    private readonly configService;
    private readonly logger;
    constructor(userRepository: Repository<User>, subscriptionRepository: Repository<Subscription>, configService: ConfigService);
    seedEssentialData(): Promise<void>;
    createDemoUser(): Promise<{
        user: User;
        credentials: {
            email: string;
            password: string;
        };
    }>;
    validateProductionEnvironment(): Promise<{
        valid: boolean;
        missingVars: string[];
    }>;
    private ensureDefaultSubscriptionPlans;
    private generateSecurePassword;
    performHealthChecks(): Promise<{
        database: boolean;
        environment: boolean;
        tables: boolean;
    }>;
}
