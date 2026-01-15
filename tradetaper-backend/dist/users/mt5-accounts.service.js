"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MT5AccountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MT5AccountsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mt5_account_entity_1 = require("./entities/mt5-account.entity");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const trades_service_1 = require("../trades/trades.service");
const enums_1 = require("../types/enums");
const user_entity_1 = require("./entities/user.entity");
const metaapi_service_1 = require("../integrations/metaapi/metaapi.service");
const trade_mapper_service_1 = require("../integrations/metaapi/trade-mapper.service");
const trade_journal_sync_service_1 = require("../trades/services/trade-journal-sync.service");
let MT5AccountsService = MT5AccountsService_1 = class MT5AccountsService {
    mt5AccountRepository;
    userRepository;
    configService;
    tradesService;
    metaApiService;
    tradeMapperService;
    tradeJournalSyncService;
    logger = new common_1.Logger(MT5AccountsService_1.name);
    encryptionKey;
    encryptionIV;
    constructor(mt5AccountRepository, userRepository, configService, tradesService, metaApiService, tradeMapperService, tradeJournalSyncService) {
        this.mt5AccountRepository = mt5AccountRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.tradesService = tradesService;
        this.metaApiService = metaApiService;
        this.tradeMapperService = tradeMapperService;
        this.tradeJournalSyncService = tradeJournalSyncService;
        const encryptionKeyString = this.configService.get('MT5_ENCRYPTION_KEY') ||
            crypto.randomBytes(32).toString('hex');
        const encryptionIVString = this.configService.get('MT5_ENCRYPTION_IV') ||
            crypto.randomBytes(16).toString('hex');
        this.encryptionKey = Buffer.from(encryptionKeyString, 'hex');
        this.encryptionIV = Buffer.from(encryptionIVString, 'hex');
        if (!this.configService.get('MT5_ENCRYPTION_KEY') &&
            this.configService.get('NODE_ENV') !== 'production') {
            this.logger.warn('Using generated encryption keys. Set MT5_ENCRYPTION_KEY and MT5_ENCRYPTION_IV ' +
                'environment variables for production use.');
        }
    }
    encrypt(text) {
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIV);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decrypt(encryptedText) {
        try {
            if (!encryptedText || typeof encryptedText !== 'string') {
                throw new Error('Invalid encrypted data');
            }
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIV);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error(`Failed to decrypt data: ${error.message}`);
            throw new Error('Failed to decrypt sensitive data');
        }
    }
    isMetaApiAvailable() {
        return this.metaApiService.isAvailable();
    }
    async create(createDto, userId) {
        this.logger.log(`Creating MT5 account for user ${userId}`);
        const mt5Account = this.mt5AccountRepository.create({
            accountName: createDto.accountName,
            server: this.encrypt(createDto.server),
            login: this.encrypt(createDto.login.toString()),
            password: createDto.password ? this.encrypt(createDto.password) : 'encrypted-placeholder',
            userId: userId,
            accountType: createDto.isRealAccount ? 'real' : 'demo',
            currency: createDto.currency || 'USD',
            isActive: createDto.isActive ?? true,
            isRealAccount: createDto.isRealAccount ?? false,
            connectionStatus: 'disconnected',
            deploymentState: 'UNDEPLOYED',
            connectionState: 'DISCONNECTED',
            initialBalance: createDto.initialBalance ?? 0,
            balance: createDto.initialBalance ?? 0,
            equity: createDto.initialBalance ?? 0,
            leverage: createDto.leverage ?? 100,
            autoSyncEnabled: false,
            metadata: {},
        });
        const savedAccount = await this.mt5AccountRepository.save(mt5Account);
        this.logger.log(`MT5 account ${savedAccount.id} created successfully`);
        return this.mapToResponseDto(savedAccount);
    }
    async linkAccount(id, credentials) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        if (!this.metaApiService.isAvailable()) {
            throw new common_1.UnprocessableEntityException('MetaApi integration not available');
        }
        this.logger.log(`Linking MT5 account ${id} to MetaApi`);
        let login;
        let server;
        const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';
        try {
            if (isManual) {
                login = account.login;
                server = account.server;
            }
            else {
                login = this.decrypt(account.login);
                server = this.decrypt(account.server);
            }
        }
        catch (error) {
            this.logger.error(`Decryption failed during link: ${error.message}`);
            throw new common_1.UnprocessableEntityException('Failed to decrypt account credentials. Please delete and limits-add this account.');
        }
        try {
            const result = await this.metaApiService.provisionAccount({
                login,
                password: credentials.password,
                server,
                accountName: account.accountName,
            });
            await this.mt5AccountRepository.update(id, {
                metaApiAccountId: result.accountId,
                deploymentState: 'DEPLOYED',
                connectionState: 'CONNECTED',
                connectionStatus: 'connected',
                lastSyncError: null,
            });
            this.logger.log(`MT5 account ${id} linked successfully with MetaApi ID: ${result.accountId}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Provisioning failed: ${error.message}`);
            if (error.message.toLowerCase().includes('broker')) {
                throw new common_1.UnprocessableEntityException('Broker server not found. Check server name.');
            }
            if (error.message.toLowerCase().includes('auth') || error.message.toLowerCase().includes('password')) {
                throw new common_1.UnprocessableEntityException('Invalid credentials. Check login and password.');
            }
            throw new common_1.UnprocessableEntityException(`Link failed: ${error.message}`);
        }
    }
    async unlinkAccount(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        if (!account.metaApiAccountId) {
            throw new Error('Account is not linked to MetaApi');
        }
        await this.metaApiService.unlinkAccount(account.metaApiAccountId);
        await this.mt5AccountRepository.update(id, {
            metaApiAccountId: undefined,
            deploymentState: 'UNDEPLOYED',
            connectionState: 'DISCONNECTED',
            connectionStatus: 'disconnected',
        });
        this.logger.log(`MT5 account ${id} unlinked from MetaApi`);
    }
    async getConnectionStatus(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        if (!account.metaApiAccountId) {
            return {
                state: account.deploymentState || 'UNDEPLOYED',
                connectionStatus: account.connectionStatus || 'disconnected',
                deployed: false,
                metaApiAvailable: this.metaApiService.isAvailable(),
            };
        }
        const status = await this.metaApiService.getConnectionStatus(account.metaApiAccountId);
        return {
            ...status,
            metaApiAvailable: true,
        };
    }
    async syncAccount(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        if (!account.metaApiAccountId) {
            this.logger.warn(`Account ${id} is not linked to MetaApi, skipping sync`);
            return;
        }
        this.logger.log(`Syncing account ${id} from MetaApi`);
        try {
            await this.ensureAccountDeployed(account.metaApiAccountId);
            const accountInfo = await this.metaApiService.getAccountInfo(account.metaApiAccountId);
            await this.mt5AccountRepository.update(id, {
                balance: accountInfo.balance,
                equity: accountInfo.equity,
                margin: accountInfo.margin,
                marginFree: accountInfo.freeMargin,
                leverage: accountInfo.leverage,
                currency: accountInfo.currency,
                lastSyncAt: new Date(),
                connectionStatus: 'connected',
            });
            this.logger.log(`Account ${id} synced successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to sync account ${id}: ${error.message}`);
            await this.mt5AccountRepository.update(id, {
                lastSyncError: error.message,
                lastSyncErrorAt: new Date(),
                syncAttempts: (account.syncAttempts || 0) + 1,
            });
            throw new common_1.UnprocessableEntityException(`Sync failed: ${error.message}`);
        }
    }
    async importTradesFromMT5(id, fromDate, toDate) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        if (!account.metaApiAccountId) {
            throw new Error('Account is not linked to MetaApi. Please link the account first.');
        }
        this.logger.log(`Importing trades for account ${id} from ${fromDate} to ${toDate}`);
        await this.ensureAccountDeployed(account.metaApiAccountId);
        const deals = await this.metaApiService.getDealHistory(account.metaApiAccountId, new Date(fromDate), new Date(toDate));
        const mappedTrades = this.tradeMapperService.mapDealsToTrades(deals);
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        for (const trade of mappedTrades) {
            try {
                const duplicate = await this.tradesService.findDuplicate(account.userId, trade.symbol, trade.entryDate, trade.externalId);
                if (duplicate) {
                    this.logger.debug(`Skipping duplicate trade: ${trade.symbol} at ${trade.entryDate}`);
                    skipped++;
                    continue;
                }
                const createTradeDto = {
                    assetType: trade.assetType,
                    symbol: trade.symbol,
                    side: trade.direction,
                    status: enums_1.TradeStatus.CLOSED,
                    openPrice: trade.entryPrice,
                    closePrice: trade.exitPrice || undefined,
                    openTime: trade.entryDate.toISOString(),
                    closeTime: trade.exitDate?.toISOString(),
                    quantity: trade.quantity,
                    commission: trade.commission,
                    marginUsed: trade.marginUsed,
                    notes: `${trade.notes}\nSwap: ${trade.swap}`,
                    accountId: id,
                };
                const createdTrade = await this.tradesService.create(createTradeDto, { id: account.userId });
                try {
                    await this.tradeJournalSyncService.createJournalForTrade(createdTrade);
                    this.logger.log(`Auto-created journal for trade ${createdTrade.id}`);
                }
                catch (journalError) {
                    this.logger.warn(`Failed to create journal for trade ${createdTrade.id}: ${journalError.message}`);
                }
                imported++;
            }
            catch (error) {
                this.logger.error(`Failed to import trade ${trade.externalId}: ${error.message}`);
                errors++;
            }
        }
        const totalPnL = mappedTrades
            .filter(t => !t.externalId || imported > 0)
            .reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
        const initialBal = parseFloat(String(account.initialBalance)) || 0;
        const currentBal = parseFloat(String(account.balance)) || 0;
        const baseBalance = initialBal || currentBal;
        const newBalance = baseBalance + totalPnL;
        this.logger.log(`Balance calculation: base=${baseBalance}, pnl=${totalPnL}, new=${newBalance}`);
        await this.mt5AccountRepository.update(id, {
            totalTradesImported: (account.totalTradesImported || 0) + imported,
            lastSyncAt: new Date(),
            balance: newBalance,
            equity: newBalance,
            profit: totalPnL,
        });
        this.logger.log(`Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors, P&L: ${totalPnL}`);
        return { imported, skipped, errors };
    }
    async createManual(manualAccountData) {
        this.logger.log(`Creating manual MT5 account for user ${manualAccountData.userId}`);
        const mt5Account = this.mt5AccountRepository.create({
            accountName: manualAccountData.accountName,
            server: manualAccountData.server,
            login: manualAccountData.login.toString(),
            password: 'manual-account',
            userId: manualAccountData.userId,
            accountType: 'demo',
            currency: manualAccountData.currency || 'USD',
            isActive: true,
            isRealAccount: manualAccountData.isRealAccount || false,
            connectionStatus: 'manual',
            deploymentState: 'MANUAL',
            connectionState: 'MANUAL',
            balance: 0,
            equity: 0,
            leverage: 1,
            autoSyncEnabled: false,
            metadata: { isManual: true },
        });
        const savedAccount = await this.mt5AccountRepository.save(mt5Account);
        return {
            id: savedAccount.id,
            accountName: savedAccount.accountName,
            server: savedAccount.server,
            login: savedAccount.login,
            accountType: savedAccount.accountType,
            currency: savedAccount.currency,
            isActive: savedAccount.isActive,
            isRealAccount: savedAccount.isRealAccount,
            connectionStatus: 'manual',
            isManual: true,
            balance: savedAccount.balance,
            equity: savedAccount.equity,
            leverage: savedAccount.leverage,
            createdAt: savedAccount.createdAt,
            updatedAt: savedAccount.updatedAt,
            userId: savedAccount.userId,
        };
    }
    async findAllByUser(userId) {
        const accounts = await this.mt5AccountRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        const validAccounts = [];
        for (const account of accounts) {
            try {
                const responseDto = this.mapToResponseDto(account);
                validAccounts.push(responseDto);
            }
            catch (error) {
                this.logger.warn(`Account ${account.id} has encryption issue, returning with masked data: ${error.message}`);
                validAccounts.push({
                    id: account.id,
                    accountName: account.accountName || 'Unknown Account',
                    server: '[Encrypted]',
                    login: '[Encrypted]',
                    isActive: account.isActive,
                    balance: parseFloat(String(account.balance)) || 0,
                    initialBalance: parseFloat(String(account.initialBalance)) || 0,
                    accountType: account.accountType,
                    currency: account.currency,
                    lastSyncAt: account.lastSyncAt,
                    createdAt: account.createdAt,
                    updatedAt: account.updatedAt,
                    metaApiAccountId: account.metaApiAccountId,
                    connectionStatus: account.connectionStatus || 'disconnected',
                    isRealAccount: account.isRealAccount,
                });
            }
        }
        return validAccounts;
    }
    async findOne(id) {
        return this.mt5AccountRepository.findOne({ where: { id } });
    }
    async update(id, updateMT5AccountDto) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        const updatedData = {};
        if (updateMT5AccountDto.password) {
            updatedData.password = this.encrypt(updateMT5AccountDto.password);
        }
        if (updateMT5AccountDto.login) {
            updatedData.login = this.encrypt(updateMT5AccountDto.login);
        }
        if (updateMT5AccountDto.server) {
            updatedData.server = this.encrypt(updateMT5AccountDto.server);
        }
        if (updateMT5AccountDto.accountName) {
            updatedData.accountName = updateMT5AccountDto.accountName;
        }
        if (updateMT5AccountDto.accountType !== undefined) {
            updatedData.accountType = updateMT5AccountDto.accountType;
        }
        if (updateMT5AccountDto.currency !== undefined) {
            updatedData.currency = updateMT5AccountDto.currency;
        }
        if (updateMT5AccountDto.isActive !== undefined) {
            updatedData.isActive = updateMT5AccountDto.isActive;
        }
        if (updateMT5AccountDto.target !== undefined) {
            updatedData.target = updateMT5AccountDto.target;
        }
        await this.mt5AccountRepository.update(id, updatedData);
        const updatedAccount = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!updatedAccount) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        return this.mapToResponseDto(updatedAccount);
    }
    async remove(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        if (account.metaApiAccountId) {
            try {
                await this.metaApiService.unlinkAccount(account.metaApiAccountId);
            }
            catch (error) {
                this.logger.warn(`Failed to unlink from MetaApi: ${error.message}`);
            }
        }
        try {
            await this.mt5AccountRepository.manager.query('UPDATE trades SET "accountId" = NULL WHERE "accountId" = $1', [id]);
        }
        catch (error) {
            this.logger.warn(`Failed to orphan trades: ${error.message}`);
        }
        await this.mt5AccountRepository.delete(id);
        this.logger.log(`Successfully deleted MT5 account ${id}`);
    }
    mapToResponseDto(account) {
        const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';
        const { password, login, server, ...rest } = account;
        return {
            ...rest,
            login: isManual ? login : this.decrypt(login),
            server: isManual ? server : this.decrypt(server),
        };
    }
    async cleanupCorruptedAccounts(accountIds) {
        try {
            this.logger.log(`Cleaning up ${accountIds.length} corrupted MT5 accounts`);
            await this.mt5AccountRepository.delete(accountIds);
        }
        catch (error) {
            this.logger.error(`Failed to cleanup corrupted accounts: ${error.message}`);
        }
    }
    async ensureAccountDeployed(metaApiAccountId) {
        try {
            const status = await this.metaApiService.getConnectionStatus(metaApiAccountId);
            if (!status.deployed) {
                this.logger.log(`Account ${metaApiAccountId} is UNDEPLOYED. Auto-deploying for sync...`);
                await this.metaApiService.deployAccount(metaApiAccountId);
                await this.mt5AccountRepository.update({ metaApiAccountId }, {
                    deploymentState: 'DEPLOYED',
                    connectionState: 'CONNECTED'
                });
            }
        }
        catch (error) {
            if (error.message && error.message.toLowerCase().includes('not found')) {
                this.logger.warn(`MetaApi account not found (likely deleted remotely): ${error.message}`);
                throw new common_1.UnprocessableEntityException('MetaApi account not found. It may have been deleted remotely. Please unlink and re-link this account.');
            }
            this.logger.error(`Failed to ensure account deployment: ${error.message}`);
            throw error;
        }
    }
    async getCandles(accountId, symbol, timeframe, startTime, endTime) {
        const account = await this.findOne(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        if (!account.login) {
            return [];
        }
        return this.metaApiService.getCandles(account.id, symbol, timeframe, startTime, endTime);
    }
};
exports.MT5AccountsService = MT5AccountsService;
exports.MT5AccountsService = MT5AccountsService = MT5AccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mt5_account_entity_1.MT5Account)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        trades_service_1.TradesService,
        metaapi_service_1.MetaApiService,
        trade_mapper_service_1.TradeMapperService,
        trade_journal_sync_service_1.TradeJournalSyncService])
], MT5AccountsService);
//# sourceMappingURL=mt5-accounts.service.js.map