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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MetaApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const metaapi_cloud_sdk_1 = __importDefault(require("metaapi.cloud-sdk"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mt5_account_entity_1 = require("./entities/mt5-account.entity");
const user_entity_1 = require("./entities/user.entity");
let MetaApiService = MetaApiService_1 = class MetaApiService {
    configService;
    mt5AccountRepository;
    userRepository;
    logger = new common_1.Logger(MetaApiService_1.name);
    metaApi;
    constructor(configService, mt5AccountRepository, userRepository) {
        this.configService = configService;
        this.mt5AccountRepository = mt5AccountRepository;
        this.userRepository = userRepository;
        this.initializeMetaApi();
    }
    initializeMetaApi() {
        const apiToken = this.configService.get('METAAPI_API_TOKEN');
        const environment = this.configService.get('METAAPI_ENVIRONMENT', 'sandbox');
        const domain = this.configService.get('METAAPI_DOMAIN', 'agiliumtrade.ai');
        const requestTimeout = parseInt(this.configService.get('METAAPI_REQUEST_TIMEOUT', '60000'), 10);
        if (!apiToken) {
            this.logger.error('MetaApi API token not configured');
            throw new Error('MetaApi configuration missing');
        }
        this.metaApi = new metaapi_cloud_sdk_1.default(apiToken, {
            domain,
            requestTimeout,
            retryOpts: {
                retries: 3,
                minDelayInSeconds: 1,
                maxDelayInSeconds: 30,
            },
        });
        this.logger.log(`MetaApi initialized for ${environment} environment`);
    }
    async getAvailableServers() {
        try {
            return [
                { name: 'MetaQuotes-Demo', type: 'demo' },
                { name: 'ICMarkets-Demo', type: 'demo' },
                { name: 'Pepperstone-Demo', type: 'demo' },
                { name: 'FTMO-Demo', type: 'demo' },
                { name: 'Alpari-Demo', type: 'demo' },
                { name: 'XM-Demo', type: 'demo' },
                { name: 'IG-Demo', type: 'demo' },
                { name: 'OANDA-Demo', type: 'demo' },
            ];
        }
        catch (error) {
            this.logger.error('Failed to fetch available servers', error);
            return [
                { name: 'MetaQuotes-Demo', type: 'demo' },
                { name: 'ICMarkets-Demo', type: 'demo' },
                { name: 'Pepperstone-Demo', type: 'demo' },
            ];
        }
    }
    async getProvisioningProfile(server) {
        try {
            const profiles = await this.metaApi.provisioningProfileApi.getProvisioningProfiles(5, 'active');
            let profile = profiles.find((p) => p.name.includes(server));
            if (!profile) {
                const profileData = {
                    name: `TradeTaper-${server}`,
                    version: 5,
                    brokerTimezone: 'EET',
                    brokerDSTSwitchTimezone: 'EET',
                };
                profile =
                    await this.metaApi.provisioningProfileApi.createProvisioningProfile(profileData);
                this.logger.log(`Created new provisioning profile for server: ${server}`);
            }
            return profile;
        }
        catch (error) {
            this.logger.error(`Failed to get/create provisioning profile for ${server}`, error);
            throw new common_1.InternalServerErrorException('Failed to setup broker connection');
        }
    }
    async addMT5Account(userId, credentials) {
        try {
            this.logger.log(`Adding MT5 account for user ${userId} on server ${credentials.server}`);
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            const existingAccount = await this.mt5AccountRepository.findOne({
                where: { userId, login: credentials.login, server: credentials.server },
            });
            if (existingAccount) {
                throw new common_1.BadRequestException('MT5 account already exists');
            }
            const profile = await this.getProvisioningProfile(credentials.server);
            const accountData = {
                login: credentials.login,
                password: credentials.password,
                name: credentials.accountName,
                server: credentials.server,
                provisioningProfileId: profile.id,
                application: 'TradeTaper',
                magic: 1000,
                quoteConnection: false,
                reliability: 'regular',
                tags: ['TradeTaper-User'],
                region: 'new-york',
                baseCurrency: 'USD',
            };
            const metaApiAccount = await this.metaApi.metatraderAccountApi.createAccount(accountData);
            await metaApiAccount.deploy();
            const deploymentTimeout = 300000;
            const startTime = Date.now();
            while (!['DEPLOYED'].includes(metaApiAccount.state) &&
                Date.now() - startTime < deploymentTimeout) {
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await metaApiAccount.reload();
            }
            if (!['DEPLOYED'].includes(metaApiAccount.state)) {
                throw new common_1.InternalServerErrorException('Account deployment timeout');
            }
            const mt5Account = this.mt5AccountRepository.create({
                accountName: credentials.accountName,
                server: credentials.server,
                login: credentials.login,
                password: credentials.password,
                metaApiAccountId: metaApiAccount.id,
                provisioningProfileId: profile.id,
                deploymentState: metaApiAccount.state,
                connectionState: 'DISCONNECTED',
                isRealAccount: credentials.isRealAccount,
                isActive: true,
                userId: userId,
                region: metaApiAccount.region || 'new-york',
            });
            const savedAccount = await this.mt5AccountRepository.save(mt5Account);
            this.connectAccount(savedAccount.id).catch((error) => {
                this.logger.error(`Failed to connect account ${savedAccount.id}`, error);
            });
            this.logger.log(`Successfully added MT5 account: ${savedAccount.id}`);
            return savedAccount;
        }
        catch (error) {
            this.logger.error('Failed to add MT5 account', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to add MT5 account');
        }
    }
    async connectAccount(accountId) {
        try {
            const account = await this.mt5AccountRepository.findOne({
                where: { id: accountId },
            });
            if (!account || !account.metaApiAccountId) {
                throw new common_1.BadRequestException('Account not found or not configured');
            }
            const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(account.metaApiAccountId);
            if (!['DEPLOYED'].includes(metaApiAccount.state)) {
                await metaApiAccount.deploy();
                const deploymentTimeout = 300000;
                const startTime = Date.now();
                while (!['DEPLOYED'].includes(metaApiAccount.state) &&
                    Date.now() - startTime < deploymentTimeout) {
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    await metaApiAccount.reload();
                }
            }
            const connection = await metaApiAccount.getStreamingConnection();
            await connection.connect();
            await connection.waitSynchronized({
                applicationPattern: 'TradeTaper',
                timeoutInSeconds: 300,
            });
            await this.mt5AccountRepository.update(accountId, {
                deploymentState: metaApiAccount.state,
                connectionState: 'SYNCHRONIZED',
                connectionStatus: 'CONNECTED',
                lastHeartbeatAt: new Date(),
                isStreamingActive: true,
                lastSyncAt: new Date(),
            });
            this.logger.log(`Account ${accountId} connected`);
        }
        catch (error) {
            this.logger.error(`Failed to connect account ${accountId}`, error);
            await this.mt5AccountRepository.update(accountId, {
                connectionState: 'DISCONNECTED',
                connectionStatus: 'DISCONNECTED',
                lastSyncErrorAt: new Date(),
                lastSyncError: error.message,
                isStreamingActive: false,
            });
            throw error;
        }
    }
    async getHistoricalTrades(accountId, filter) {
        this.logger.log(`Fetching historical trades for account ${accountId}`);
        return [];
    }
    async getLiveTradeData(accountId) {
        try {
            const account = await this.mt5AccountRepository.findOne({
                where: { id: accountId },
            });
            if (!account || !account.metaApiAccountId) {
                throw new common_1.BadRequestException('Account not found');
            }
            const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(account.metaApiAccountId);
            const connection = await metaApiAccount.getStreamingConnection();
            if (!connection.synchronized) {
                await connection.connect();
                await connection.waitSynchronized({ timeoutInSeconds: 60 });
            }
            const terminalState = connection.terminalState;
            const positions = terminalState.positions;
            const orders = terminalState.orders;
            const accountInfo = terminalState.accountInformation;
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const deals = connection.historyStorage.getDealsByTimeRange(yesterday, new Date());
            if (accountInfo) {
                await this.mt5AccountRepository.update(accountId, {
                    balance: parseFloat(accountInfo.balance?.toString() || '0'),
                    equity: parseFloat(accountInfo.equity?.toString() || '0'),
                    margin: parseFloat(accountInfo.margin?.toString() || '0'),
                    marginFree: parseFloat(accountInfo.freeMargin?.toString() || '0'),
                    profit: parseFloat('0'),
                    leverage: accountInfo.leverage || 1,
                    currency: accountInfo.currency || 'USD',
                    lastHeartbeatAt: new Date(),
                    accountInfo: accountInfo,
                });
            }
            return {
                positions,
                orders,
                accountInfo: accountInfo,
                deals,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get live trade data for account ${accountId}`, error);
            throw new common_1.InternalServerErrorException('Failed to fetch live trade data');
        }
    }
    async startStreaming(accountId) {
        try {
            const account = await this.mt5AccountRepository.findOne({
                where: { id: accountId },
            });
            if (!account || !account.metaApiAccountId) {
                throw new common_1.BadRequestException('Account not found');
            }
            const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(account.metaApiAccountId);
            const connection = await metaApiAccount.getStreamingConnection();
            await connection.connect();
            await connection.waitSynchronized({ timeoutInSeconds: 300 });
            await this.mt5AccountRepository.update(accountId, {
                isStreamingActive: true,
                connectionState: 'SYNCHRONIZED',
                connectionStatus: 'CONNECTED',
                lastHeartbeatAt: new Date(),
            });
            this.logger.log(`Streaming started for account ${accountId}`);
            return connection;
        }
        catch (error) {
            this.logger.error(`Failed to start streaming for account ${accountId}`, error);
            await this.mt5AccountRepository.update(accountId, {
                isStreamingActive: false,
                connectionState: 'DISCONNECTED',
                lastSyncError: error.message,
                lastSyncErrorAt: new Date(),
            });
            throw error;
        }
    }
    async stopStreaming(accountId) {
        try {
            const account = await this.mt5AccountRepository.findOne({
                where: { id: accountId },
            });
            if (!account || !account.metaApiAccountId) {
                throw new common_1.BadRequestException('Account not found');
            }
            const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(account.metaApiAccountId);
            const connection = await metaApiAccount.getStreamingConnection();
            await connection.close();
            await this.mt5AccountRepository.update(accountId, {
                isStreamingActive: false,
                connectionState: 'DISCONNECTED',
                connectionStatus: 'DISCONNECTED',
            });
            this.logger.log(`Streaming stopped for account ${accountId}`);
        }
        catch (error) {
            this.logger.error(`Failed to stop streaming for account ${accountId}`, error);
            throw error;
        }
    }
    async removeMT5Account(accountId, userId) {
        try {
            const account = await this.mt5AccountRepository.findOne({
                where: { id: accountId, userId },
            });
            if (!account) {
                throw new common_1.BadRequestException('Account not found');
            }
            await this.stopStreaming(accountId);
            if (account.metaApiAccountId) {
                try {
                    const metaApiAccount = await this.metaApi.metatraderAccountApi.getAccount(account.metaApiAccountId);
                    await metaApiAccount.undeploy();
                    await metaApiAccount.remove();
                }
                catch (error) {
                    this.logger.warn(`Failed to remove MetaApi account ${account.metaApiAccountId}`, error);
                }
            }
            await this.mt5AccountRepository.remove(account);
            this.logger.log(`Successfully removed MT5 account: ${accountId}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove MT5 account ${accountId}`, error);
            throw error;
        }
    }
    async getAccountStatus(accountId) {
        const account = await this.mt5AccountRepository.findOne({
            where: { id: accountId },
        });
        if (!account) {
            throw new common_1.BadRequestException('Account not found');
        }
        return {
            isConnected: account.connectionStatus === 'CONNECTED',
            isStreaming: account.isStreamingActive,
            deploymentState: account.deploymentState,
            connectionState: account.connectionState,
            lastHeartbeat: account.lastHeartbeatAt,
            lastError: account.lastSyncError,
        };
    }
    async healthCheck() {
        try {
            const profiles = await this.metaApi.provisioningProfileApi.getProvisioningProfiles(5, 'active');
            return {
                status: 'ok',
                message: 'MetaApi service is healthy',
                details: {
                    profileCount: profiles.length,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            this.logger.error('MetaApi health check failed', error);
            return {
                status: 'error',
                message: 'MetaApi service is unhealthy',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
};
exports.MetaApiService = MetaApiService;
exports.MetaApiService = MetaApiService = MetaApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(mt5_account_entity_1.MT5Account)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MetaApiService);
//# sourceMappingURL=metaapi.service.js.map