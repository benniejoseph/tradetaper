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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MetaApiManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaApiManagerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const metaapi_cloud_sdk_1 = __importDefault(require("metaapi.cloud-sdk"));
let MetaApiManagerService = MetaApiManagerService_1 = class MetaApiManagerService {
    configService;
    logger = new common_1.Logger(MetaApiManagerService_1.name);
    metaApiAccounts = [];
    apiInstances = new Map();
    constructor(configService) {
        this.configService = configService;
        this.initializeMetaApiAccounts();
    }
    initializeMetaApiAccounts() {
        const primaryToken = this.configService.get('METAAPI_API_TOKEN');
        const environment = this.configService.get('METAAPI_ENVIRONMENT', 'sandbox');
        if (primaryToken) {
            this.metaApiAccounts.push({
                id: 'primary',
                token: primaryToken,
                maxUsers: 500,
                currentUsers: 0,
                environment,
                isActive: true,
            });
            this.apiInstances.set('primary', new metaapi_cloud_sdk_1.default(primaryToken));
        }
        this.loadAdditionalAccounts();
    }
    loadAdditionalAccounts() {
        const additionalTokens = this.configService.get('METAAPI_ADDITIONAL_TOKENS');
        if (additionalTokens) {
            const tokens = additionalTokens.split(',');
            tokens.forEach((token, index) => {
                const accountId = `account_${index + 1}`;
                this.metaApiAccounts.push({
                    id: accountId,
                    token: token.trim(),
                    maxUsers: 500,
                    currentUsers: 0,
                    environment: this.configService.get('METAAPI_ENVIRONMENT', 'sandbox'),
                    isActive: true,
                });
                this.apiInstances.set(accountId, new metaapi_cloud_sdk_1.default(token.trim()));
            });
        }
    }
    assignMetaApiAccount(userId) {
        const availableAccount = this.metaApiAccounts.find((account) => account.isActive && account.currentUsers < account.maxUsers);
        if (!availableAccount) {
            throw new Error('No available MetaApi account capacity. Please contact support.');
        }
        availableAccount.currentUsers++;
        const api = this.apiInstances.get(availableAccount.id);
        if (!api) {
            throw new Error(`MetaApi instance not found for account ${availableAccount.id}`);
        }
        this.logger.log(`Assigned MetaApi account ${availableAccount.id} to user ${userId}`);
        return {
            accountId: availableAccount.id,
            api,
        };
    }
    releaseMetaApiAccount(accountId, userId) {
        const account = this.metaApiAccounts.find((acc) => acc.id === accountId);
        if (account && account.currentUsers > 0) {
            account.currentUsers--;
            this.logger.log(`Released MetaApi account ${accountId} for user ${userId}`);
        }
    }
    getMetaApiInstance(accountId) {
        const api = this.apiInstances.get(accountId);
        if (!api) {
            throw new Error(`MetaApi account ${accountId} not found`);
        }
        return api;
    }
    getAccountStats() {
        return this.metaApiAccounts.map((account) => ({
            id: account.id,
            currentUsers: account.currentUsers,
            maxUsers: account.maxUsers,
            utilizationPercent: (account.currentUsers / account.maxUsers) * 100,
            isActive: account.isActive,
        }));
    }
    async addMetaApiAccount(token, maxUsers = 500) {
        try {
            const testApi = new metaapi_cloud_sdk_1.default(token);
            await testApi.provisioningProfileApi.getProvisioningProfiles(5, 'active');
            const accountId = `account_${Date.now()}`;
            this.metaApiAccounts.push({
                id: accountId,
                token,
                maxUsers,
                currentUsers: 0,
                environment: this.configService.get('METAAPI_ENVIRONMENT', 'sandbox'),
                isActive: true,
            });
            this.apiInstances.set(accountId, testApi);
            this.logger.log(`Added new MetaApi account: ${accountId}`);
            return accountId;
        }
        catch (error) {
            throw new Error(`Invalid MetaApi token: ${error.message}`);
        }
    }
    async healthCheck() {
        const healthChecks = await Promise.allSettled(this.metaApiAccounts.map(async (account) => {
            try {
                const api = this.apiInstances.get(account.id);
                if (!api) {
                    throw new Error(`MetaApi instance not found for account ${account.id}`);
                }
                await api.provisioningProfileApi.getProvisioningProfiles(5, 'active');
                return {
                    accountId: account.id,
                    status: 'healthy',
                    currentUsers: account.currentUsers,
                    maxUsers: account.maxUsers,
                };
            }
            catch (error) {
                return {
                    accountId: account.id,
                    status: 'unhealthy',
                    error: error.message,
                    currentUsers: account.currentUsers,
                    maxUsers: account.maxUsers,
                };
            }
        }));
        return healthChecks.map((result) => result.status === 'fulfilled' ? result.value : result.reason);
    }
};
exports.MetaApiManagerService = MetaApiManagerService;
exports.MetaApiManagerService = MetaApiManagerService = MetaApiManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MetaApiManagerService);
//# sourceMappingURL=metaapi-manager.service.js.map