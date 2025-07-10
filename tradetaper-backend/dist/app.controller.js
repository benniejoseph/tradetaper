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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
let AppController = class AppController {
    appService;
    dataSource;
    constructor(appService, dataSource) {
        this.appService = appService;
        this.dataSource = dataSource;
    }
    getHello() {
        return this.appService.getHello();
    }
    getTestMessage() {
        return { message: 'TradeTaper Backend API is running!' };
    }
    ping() {
        return {
            message: 'pong',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            database: {
                url: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
                type: 'PostgreSQL'
            },
            deployment: {
                platform: 'Google Cloud Run',
                region: 'us-central1'
            }
        };
    }
    health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
    testDeployment() {
        return {
            message: 'TradeTaper Backend deployed successfully!',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            features: [
                'User Management',
                'Trade Tracking',
                'Admin Dashboard',
                'Database Integration'
            ]
        };
    }
    railwayHealth() {
        return {
            status: 'ok',
            message: 'TradeTaper Backend is running on Railway',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };
    }
    async validateStripe() {
        return {
            message: 'Stripe validation endpoint',
            status: 'not_implemented'
        };
    }
    async runMigrationsGet() {
        try {
            console.log('🔄 Running database migrations...');
            const migrations = await this.dataSource.runMigrations();
            return {
                success: true,
                message: `Successfully ran ${migrations.length} migrations`,
                migrations: migrations.map(m => m.name),
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            return {
                success: false,
                message: 'Migration failed',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async runMigrations() {
        try {
            console.log('🔄 Running database migrations...');
            const migrations = await this.dataSource.runMigrations();
            return {
                success: true,
                message: `Successfully ran ${migrations.length} migrations`,
                migrations: migrations.map(m => m.name),
            };
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            return {
                success: false,
                message: 'Migration failed',
                error: error.message,
            };
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getTestMessage", null);
__decorate([
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "ping", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('test-deployment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "testDeployment", null);
__decorate([
    (0, common_1.Get)('railway-health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "railwayHealth", null);
__decorate([
    (0, common_1.Post)('validate-stripe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "validateStripe", null);
__decorate([
    (0, common_1.Get)('migrate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "runMigrationsGet", null);
__decorate([
    (0, common_1.Post)('run-migrations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "runMigrations", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __param(1, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [app_service_1.AppService,
        typeorm_1.DataSource])
], AppController);
//# sourceMappingURL=app.controller.js.map