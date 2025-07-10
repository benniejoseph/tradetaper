"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductionSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionSeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const subscription_entity_1 = require("../subscriptions/entities/subscription.entity");
const config_1 = require("@nestjs/config");
let ProductionSeedService = ProductionSeedService_1 = class ProductionSeedService {
    userRepository;
    subscriptionRepository;
    configService;
    logger = new common_1.Logger(ProductionSeedService_1.name);
    constructor(userRepository, subscriptionRepository, configService) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.configService = configService;
    }
    async seedEssentialData() {
        this.logger.log('Starting production essential data seeding...');
        try {
            await this.ensureDefaultSubscriptionPlans();
            this.logger.log('Production essential data seeding completed successfully.');
        }
        catch (error) {
            this.logger.error('Production seeding failed:', error);
            throw error;
        }
    }
    async createDemoUser() {
        const existingDemo = await this.userRepository.findOne({
            where: { email: 'demo@tradetaper.com' },
        });
        if (existingDemo) {
            this.logger.log('Demo user already exists');
            return {
                user: existingDemo,
                credentials: { email: 'demo@tradetaper.com', password: 'Contact admin for password' },
            };
        }
        const bcrypt = require('bcrypt');
        const tempPassword = this.generateSecurePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const demoUser = this.userRepository.create({
            email: 'demo@tradetaper.com',
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'User',
        });
        const savedUser = await this.userRepository.save(demoUser);
        const subscription = this.subscriptionRepository.create({
            userId: savedUser.id,
            plan: 'free',
            status: subscription_entity_1.SubscriptionStatus.ACTIVE,
        });
        await this.subscriptionRepository.save(subscription);
        this.logger.log('Demo user created successfully');
        return {
            user: savedUser,
            credentials: { email: 'demo@tradetaper.com', password: tempPassword },
        };
    }
    async validateProductionEnvironment() {
        const requiredVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'STRIPE_SECRET_KEY',
            'STRIPE_PUBLISHABLE_KEY',
            'FRONTEND_URL',
        ];
        const missingVars = [];
        for (const varName of requiredVars) {
            const value = this.configService.get(varName);
            if (!value || value.trim() === '') {
                missingVars.push(varName);
            }
        }
        const valid = missingVars.length === 0;
        if (!valid) {
            this.logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        else {
            this.logger.log('All required environment variables are present');
        }
        return { valid, missingVars };
    }
    async ensureDefaultSubscriptionPlans() {
        this.logger.log('Default subscription plans ensured via migrations');
    }
    generateSecurePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    async performHealthChecks() {
        const checks = {
            database: false,
            environment: false,
            tables: false,
        };
        try {
            await this.userRepository.query('SELECT 1');
            checks.database = true;
        }
        catch (error) {
            this.logger.error('Database health check failed:', error);
        }
        try {
            const envCheck = await this.validateProductionEnvironment();
            checks.environment = envCheck.valid;
        }
        catch (error) {
            this.logger.error('Environment health check failed:', error);
        }
        try {
            await this.userRepository.count();
            await this.subscriptionRepository.count();
            checks.tables = true;
        }
        catch (error) {
            this.logger.error('Tables health check failed:', error);
        }
        this.logger.log('Production health checks completed:', checks);
        return checks;
    }
};
exports.ProductionSeedService = ProductionSeedService;
exports.ProductionSeedService = ProductionSeedService = ProductionSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], ProductionSeedService);
//# sourceMappingURL=production-seed.service.js.map