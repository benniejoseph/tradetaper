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
const user_entity_1 = require("./entities/user.entity");
const metaapi_service_1 = require("./metaapi.service");
const mt5_positions_gateway_1 = require("../websocket/mt5-positions.gateway");
const metaapi_cloud_sdk_1 = require("metaapi.cloud-sdk");
const enums_1 = require("../types/enums");
let MT5AccountsService = MT5AccountsService_1 = class MT5AccountsService {
    mt5AccountRepository;
    userRepository;
    configService;
    tradesService;
    metaApiService;
    mt5PositionsGateway;
    dataSource;
    logger = new common_1.Logger(MT5AccountsService_1.name);
    encryptionKey;
    constructor(mt5AccountRepository, userRepository, configService, tradesService, metaApiService, mt5PositionsGateway, dataSource) {
        this.mt5AccountRepository = mt5AccountRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.tradesService = tradesService;
        this.metaApiService = metaApiService;
        this.mt5PositionsGateway = mt5PositionsGateway;
        this.dataSource = dataSource;
        const encryptionKeyString = this.configService.get('MT5_ENCRYPTION_KEY') ||
            crypto.randomBytes(32).toString('hex');
        this.encryptionKey = Buffer.from(encryptionKeyString, 'hex');
        if (!this.configService.get('MT5_ENCRYPTION_KEY') &&
            this.configService.get('NODE_ENV') !== 'production') {
            this.logger.warn('Using generated encryption key. Set MT5_ENCRYPTION_KEY for production.');
        }
    }
    async disconnectMetaApiAccount(accountId, userId) {
        const account = await this.mt5AccountRepository.findOne({
            where: { id: accountId, userId },
        });
        if (!account) {
            throw new common_1.NotFoundException('MT5 account not found');
        }
        if (!account.metaApiAccountId) {
            throw new common_1.BadRequestException('Account is not connected to MetaApi');
        }
        const metaApiAccountId = account.metaApiAccountId;
        this.logger.log(`Disconnecting MetaAPI account ${metaApiAccountId} for user ${userId}`);
        try {
            if (account.isStreamingActive) {
                await this.metaApiService.closeConnection(metaApiAccountId);
                const listener = this.metaApiListeners.get(metaApiAccountId);
                if (listener) {
                    try {
                        const connection = await this.metaApiService.getStreamingConnection(metaApiAccountId);
                        if (connection) {
                            connection.removeSynchronizationListener(listener);
                        }
                    }
                    catch (e) {
                        this.logger.warn(`Could not remove MetaAPI listener during disconnect: ${e.message}`);
                    }
                    this.metaApiListeners.delete(metaApiAccountId);
                }
            }
            try {
                await this.metaApiService.removeAccount(metaApiAccountId);
                this.logger.log(`Deleted MetaAPI account ${metaApiAccountId} from cloud`);
            }
            catch (e) {
                this.logger.warn(`Failed to delete MetaAPI account ${metaApiAccountId} from cloud: ${e.message}. It might already be deleted.`);
            }
            await this.mt5AccountRepository.update(accountId, {
                metaApiAccountId: null,
                provisioningProfileId: null,
                connectionStatus: 'disconnected',
                connectionState: 'DISCONNECTED',
                deploymentState: 'UNDEPLOYED',
                isStreamingActive: false,
                syncAttempts: 0,
                lastHeartbeatAt: null,
                lastSyncAt: null,
                lastSyncError: null,
            });
            this.logger.log(`Successfully disconnected MetaAPI for account ${accountId}`);
        }
        catch (error) {
            this.logger.error(`Error disconnecting MetaAPI account ${accountId}: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Failed to disconnect MetaAPI: ${error.message}`);
        }
    }
    metaApiListeners = new Map();
    isMetaApiEnabled() {
        return this.metaApiService.isEnabled();
    }
    getMetaApiService() {
        return this.metaApiService;
    }
    getCachedConnection(metaApiAccountId) {
        return this.metaApiService.getCachedConnection(metaApiAccountId);
    }
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final(),
        ]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }
    decrypt(raw) {
        try {
            if (!raw || typeof raw !== 'string') {
                throw new Error('Invalid encrypted data');
            }
            if (raw.includes(':')) {
                const colonIdx = raw.indexOf(':');
                const iv = Buffer.from(raw.substring(0, colonIdx), 'hex');
                const enc = Buffer.from(raw.substring(colonIdx + 1), 'hex');
                const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
                return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
            }
            const legacyIvString = this.configService.get('MT5_ENCRYPTION_IV') || '';
            if (!legacyIvString)
                throw new Error('No legacy IV configured for old-format decryption');
            const iv = Buffer.from(legacyIvString, 'hex').slice(0, 16);
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
            let decrypted = decipher.update(raw, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error(`Failed to decrypt data: ${error.message}`);
            throw new Error('Failed to decrypt sensitive data');
        }
    }
    accountFingerprint(login, server) {
        return crypto
            .createHash('sha256')
            .update(`${login.toLowerCase()}:${server.toLowerCase()}`)
            .digest('hex');
    }
    async create(createDto, userId) {
        this.logger.log(`Creating MetaApi MT5 account for user ${userId}`);
        if (!this.metaApiService.isEnabled()) {
            throw new common_1.BadRequestException('MetaApi integration is not configured. Please contact support.');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (!createDto.password) {
            throw new common_1.BadRequestException('Password is required to connect MT5');
        }
        const fingerprint = this.accountFingerprint(createDto.login.toString(), createDto.server);
        const existingByFingerprint = await this.mt5AccountRepository.findOne({
            where: { userId, loginServerFingerprint: fingerprint },
        });
        if (existingByFingerprint) {
            throw new common_1.BadRequestException('MT5 account already linked. This login and server combination already exists.');
        }
        const provision = await this.metaApiService.provisionAccount({
            accountName: createDto.accountName,
            server: createDto.server,
            login: createDto.login,
            password: createDto.password,
            isRealAccount: createDto.isRealAccount ?? false,
        });
        const mt5Account = this.mt5AccountRepository.create({
            accountName: createDto.accountName,
            server: this.encrypt(createDto.server),
            login: this.encrypt(createDto.login.toString()),
            password: this.encrypt(createDto.password),
            userId: userId,
            accountType: createDto.accountType || (createDto.isRealAccount ? 'real' : 'demo'),
            currency: createDto.currency || 'USD',
            isActive: createDto.isActive ?? true,
            isRealAccount: createDto.isRealAccount ?? false,
            connectionStatus: 'CONNECTING',
            deploymentState: 'DEPLOYING',
            connectionState: 'CONNECTING',
            initialBalance: createDto.initialBalance ?? 0,
            balance: createDto.initialBalance ?? 0,
            equity: createDto.initialBalance ?? 0,
            leverage: createDto.leverage ?? 100,
            target: createDto.target ?? 0,
            autoSyncEnabled: true,
            metaApiAccountId: provision.metaApiAccountId,
            provisioningProfileId: provision.provisioningProfileId,
            region: provision.region,
            metadata: {
                provider: 'metaapi',
                loginServerFingerprint: fingerprint,
            },
        });
        const savedAccount = await this.mt5AccountRepository.save(mt5Account);
        this.logger.log(`MT5 MetaApi account ${savedAccount.id} created successfully (deploying in background).`);
        void this.metaApiService
            .waitForDeployment(provision.metaApiAccountId)
            .then(async (deployResult) => {
            await this.mt5AccountRepository.update(savedAccount.id, {
                deploymentState: deployResult.deploymentState,
                connectionStatus: 'CONNECTED',
            });
            return this.syncMetaApiAccount(savedAccount.id, {
                fullHistory: true,
                startStreaming: true,
            });
        })
            .catch((error) => {
            this.logger.error(`MetaApi background deploy/sync failed for account ${savedAccount.id}: ${error.message}`);
            void this.mt5AccountRepository.update(savedAccount.id, {
                deploymentState: 'ERROR',
                connectionStatus: 'DISCONNECTED',
                lastSyncError: error.message,
            });
        });
        return this.mapToResponseDto(savedAccount);
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
                    connectionStatus: account.connectionStatus || 'disconnected',
                    isRealAccount: account.isRealAccount,
                });
            }
        }
        return validAccounts;
    }
    async getMetaApiServers(query) {
        if (!this.metaApiService.isEnabled()) {
            return [];
        }
        return this.metaApiService.getKnownServers(query);
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
        const updatedAccount = await this.mt5AccountRepository.findOne({
            where: { id },
        });
        if (!updatedAccount) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        return this.mapToResponseDto(updatedAccount);
    }
    async syncMetaApiAccount(accountId, options = {}) {
        const account = await this.mt5AccountRepository.findOne({
            where: { id: accountId },
        });
        if (!account || !account.metaApiAccountId) {
            throw new common_1.BadRequestException('MetaApi account not configured');
        }
        if (!this.metaApiService.isEnabled()) {
            throw new common_1.BadRequestException('MetaApi integration is not configured');
        }
        try {
            const connection = await this.metaApiService.getStreamingConnection(account.metaApiAccountId);
            const accountInfo = connection.terminalState.accountInformation;
            if (accountInfo) {
                await this.updateAccountInfo(account.id, accountInfo);
            }
            await this.syncOpenPositionsFromMetaApi(account, connection);
            const endTime = new Date();
            const metadata = account.metadata || {};
            const storedTime = metadata.metaApiLastHistoryTime
                ? new Date(metadata.metaApiLastHistoryTime)
                : null;
            const safeStoredTime = storedTime && !Number.isNaN(storedTime.getTime()) ? storedTime : null;
            const startTime = options.fullHistory
                ? new Date(0)
                : safeStoredTime || account.lastSyncAt || new Date(0);
            let imported = 0;
            let skipped = 0;
            let failed = 0;
            const deals = connection.historyStorage.getDealsByTimeRange(startTime, endTime);
            if (deals && deals.length > 0) {
                const result = await this.processMetaApiDealsBatch(account, deals, connection);
                imported += result.imported;
                skipped += result.skipped;
                failed += result.failed;
            }
            await this.mt5AccountRepository.update(accountId, {
                connectionState: 'SYNCHRONIZED',
                connectionStatus: 'CONNECTED',
                lastSyncAt: new Date(),
                lastHeartbeatAt: new Date(),
                lastSyncError: null,
                lastSyncErrorAt: null,
                isStreamingActive: options.startStreaming ?? true,
                metadata: {
                    ...metadata,
                    metaApiLastHistoryTime: endTime.toISOString(),
                },
            });
            if (options.startStreaming ?? true) {
                await this.ensureMetaApiListener(account, connection);
            }
            return { imported, skipped, failed };
        }
        catch (error) {
            this.logger.error(`MetaApi sync failed for account ${accountId}: ${error.message}`);
            await this.mt5AccountRepository.update(accountId, {
                connectionState: 'DISCONNECTED',
                connectionStatus: 'DISCONNECTED',
                lastSyncError: error.message,
                lastSyncErrorAt: new Date(),
                isStreamingActive: false,
            });
            throw new common_1.InternalServerErrorException('Failed to sync MetaApi account');
        }
    }
    async remove(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        if (account.metaApiAccountId) {
            try {
                await this.metaApiService.closeConnection(account.metaApiAccountId);
                if (this.metaApiService.isEnabled()) {
                    await this.metaApiService.removeAccount(account.metaApiAccountId);
                }
                this.metaApiListeners.delete(account.metaApiAccountId);
            }
            catch (error) {
                this.logger.warn(`Failed to remove MetaApi account ${account.metaApiAccountId}: ${error.message}`);
            }
        }
        try {
            await this.tradesService.orphanTradesByAccount(id);
        }
        catch (error) {
            this.logger.warn(`Failed to orphan trades for account ${id}: ${error.message}`);
        }
        await this.mt5AccountRepository.delete(id);
        this.logger.log(`Successfully deleted MT5 account ${id}`);
    }
    async updateAccountInfo(accountId, accountInfo) {
        await this.mt5AccountRepository.update(accountId, {
            balance: parseFloat(accountInfo.balance?.toString() || '0'),
            equity: parseFloat(accountInfo.equity?.toString() || '0'),
            margin: parseFloat(accountInfo.margin?.toString() || '0'),
            marginFree: parseFloat(accountInfo.freeMargin?.toString() || '0'),
            leverage: accountInfo.leverage || 1,
            currency: accountInfo.currency || 'USD',
            lastHeartbeatAt: new Date(),
            accountInfo: accountInfo,
        });
    }
    positionUpdateDebounce = new Map();
    async ensureMetaApiListener(account, connection) {
        if (!account.metaApiAccountId)
            return;
        if (this.metaApiListeners.has(account.metaApiAccountId))
            return;
        const listener = new MetaApiSyncListener({
            onConnected: async () => {
                await this.mt5AccountRepository.update(account.id, {
                    connectionStatus: 'CONNECTED',
                    connectionState: 'SYNCHRONIZED',
                    isStreamingActive: true,
                    lastHeartbeatAt: new Date(),
                });
            },
            onDisconnected: async () => {
                await this.mt5AccountRepository.update(account.id, {
                    connectionStatus: 'DISCONNECTED',
                    connectionState: 'DISCONNECTED',
                    isStreamingActive: false,
                });
                void this.reconnectWithBackoff(account);
            },
            onAccountInformationUpdated: async (info) => {
                await this.updateAccountInfo(account.id, info);
            },
            onPositionsReplaced: async (positions) => {
                await this.syncOpenPositionsFromMetaApi(account, connection, positions);
            },
            onPositionUpdated: async (position) => {
                const key = `${account.id}:${position.id}`;
                const existing = this.positionUpdateDebounce.get(key);
                if (existing)
                    clearTimeout(existing);
                const timer = setTimeout(() => {
                    this.positionUpdateDebounce.delete(key);
                    void this.syncMetaApiPosition(account, position, connection);
                }, 500);
                this.positionUpdateDebounce.set(key, timer);
            },
            onDealAdded: async (deal) => {
                await this.processMetaApiDeal(account, deal, connection);
            },
        }, this.logger);
        connection.addSynchronizationListener(listener);
        this.metaApiListeners.set(account.metaApiAccountId, listener);
    }
    async reconnectWithBackoff(account) {
        let delay = 5_000;
        for (let attempt = 1; attempt <= 5; attempt++) {
            await new Promise((r) => setTimeout(r, delay));
            try {
                this.logger.log(`Reconnect attempt ${attempt} for MetaApi account ${account.id}`);
                await this.syncMetaApiAccount(account.id, { startStreaming: true });
                this.logger.log(`Reconnect successful for ${account.id}`);
                return;
            }
            catch (err) {
                this.logger.warn(`Reconnect attempt ${attempt} failed for ${account.id}: ${err.message}`);
                delay = Math.min(delay * 2, 60_000);
            }
        }
        this.logger.error(`All reconnect attempts exhausted for MetaApi account ${account.id}`);
    }
    async syncOpenPositionsFromMetaApi(account, connection, overridePositions) {
        const positions = overridePositions || connection.terminalState.positions;
        if (!positions || positions.length === 0)
            return;
        const positionIds = positions.map((p) => p.id.toString());
        const existingTrades = await this.tradesService.findManyByExternalIds(account.userId, positionIds, account.id);
        const groupedByExternalId = new Map();
        existingTrades.forEach((trade) => {
            if (!trade.externalId)
                return;
            const list = groupedByExternalId.get(trade.externalId) || [];
            list.push(trade);
            groupedByExternalId.set(trade.externalId, list);
        });
        const tradeMap = new Map();
        for (const [externalId, trades] of groupedByExternalId.entries()) {
            if (trades.length > 1) {
                const merged = await this.tradesService.mergeDuplicateExternalTrades(account.userId, externalId, account.id);
                if (merged) {
                    tradeMap.set(externalId, merged);
                }
            }
            else {
                tradeMap.set(externalId, trades[0]);
            }
        }
        for (const position of positions) {
            await this.syncMetaApiPosition(account, position, connection, tradeMap);
        }
    }
    async syncMetaApiPosition(account, position, connection, tradeMap) {
        const externalId = position.id.toString();
        const existingTrade = tradeMap?.get(externalId) ||
            (await this.tradesService.findOneByExternalId(account.userId, externalId, account.id));
        const side = position.type === 'POSITION_TYPE_BUY'
            ? enums_1.TradeDirection.LONG
            : enums_1.TradeDirection.SHORT;
        const contractSize = this.getContractSize(connection, position.symbol);
        const openTime = position.time
            ? position.time.toISOString()
            : new Date().toISOString();
        if (existingTrade) {
            const updates = {};
            if (!existingTrade.openTime && openTime)
                updates.openTime = openTime;
            if (!existingTrade.openPrice && position.openPrice)
                updates.openPrice = position.openPrice;
            if (!existingTrade.quantity && position.volume)
                updates.quantity = position.volume;
            if (!existingTrade.side)
                updates.side = side;
            if (position.stopLoss !== undefined)
                updates.stopLoss = position.stopLoss;
            if (position.takeProfit !== undefined)
                updates.takeProfit = position.takeProfit;
            if (contractSize && !existingTrade.contractSize)
                updates.contractSize = contractSize;
            if (Object.keys(updates).length > 0) {
                await this.tradesService.updateFromSync(existingTrade.id, updates, {
                    source: 'mt5',
                    changes: {},
                    note: 'MetaApi position update',
                });
            }
            this.mt5PositionsGateway.emitPositionsUpdate(account.userId, {
                enabled: true,
                accountId: account.id,
                terminalId: account.metaApiAccountId,
                positions: [
                    {
                        ticket: position.id,
                        symbol: position.symbol,
                        type: position.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL',
                        volume: position.volume,
                        openPrice: position.openPrice,
                        currentPrice: position.currentPrice,
                        profit: position.profit,
                        stopLoss: position.stopLoss,
                        takeProfit: position.takeProfit,
                        openTime: openTime,
                        swap: position.swap,
                        comment: position.comment,
                    },
                ],
                source: 'metaapi',
            });
            return;
        }
        await this.tradesService.create({
            symbol: position.symbol,
            assetType: this.detectAssetType(position.symbol),
            side,
            status: enums_1.TradeStatus.OPEN,
            openTime,
            openPrice: position.openPrice || 0,
            quantity: position.volume || 0,
            commission: 0,
            swap: position.swap || 0,
            notes: position.comment
                ? `MetaApi Position ID: ${position.id} | ${position.comment}`
                : `Auto-synced via MetaApi Position ID: ${position.id}`,
            accountId: account.id,
            stopLoss: position.stopLoss,
            takeProfit: position.takeProfit,
            externalId,
            mt5Magic: position.magic,
            contractSize,
        }, { id: account.userId });
    }
    async processMetaApiDealsBatch(account, deals, connection) {
        let imported = 0;
        let skipped = 0;
        let failed = 0;
        const filteredDeals = deals.filter((deal) => this.isSupportedDealType(deal) && !!deal.symbol);
        const positionIds = filteredDeals
            .map((deal) => deal.positionId)
            .filter(Boolean)
            .map((id) => id.toString());
        const existingTrades = await this.tradesService.findManyByExternalIds(account.userId, positionIds, account.id);
        const groupedByExternalId = new Map();
        existingTrades.forEach((trade) => {
            if (!trade.externalId)
                return;
            const list = groupedByExternalId.get(trade.externalId) || [];
            list.push(trade);
            groupedByExternalId.set(trade.externalId, list);
        });
        const existingTradesMap = new Map();
        for (const [externalId, trades] of groupedByExternalId.entries()) {
            if (trades.length > 1) {
                const merged = await this.tradesService.mergeDuplicateExternalTrades(account.userId, externalId, account.id);
                if (merged)
                    existingTradesMap.set(externalId, merged);
            }
            else {
                existingTradesMap.set(externalId, trades[0]);
            }
        }
        const orderedDeals = [...filteredDeals].sort((a, b) => a.time.getTime() - b.time.getTime());
        const BATCH_SIZE = 50;
        for (let i = 0; i < orderedDeals.length; i += BATCH_SIZE) {
            const batch = orderedDeals.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(async (deal) => {
                const externalId = deal.positionId
                    ? deal.positionId.toString()
                    : `deal_${deal.id}`;
                const existingTrade = deal.positionId
                    ? existingTradesMap.get(externalId)
                    : await this.tradesService.findOneByExternalId(account.userId, externalId, account.id);
                const result = await this.processMetaApiDeal(account, deal, connection, existingTrade, externalId);
                return { result, deal, externalId };
            }));
            for (const settled of results) {
                if (settled.status === 'fulfilled') {
                    const { result, deal, externalId } = settled.value;
                    if (result.status === 'imported') {
                        imported++;
                        if (deal.positionId && result.trade) {
                            existingTradesMap.set(externalId, result.trade);
                        }
                    }
                    else if (result.status === 'skipped') {
                        skipped++;
                    }
                    else {
                        failed++;
                    }
                }
                else {
                    failed++;
                    this.logger.error(`MetaApi batch deal failed: ${settled.reason?.message}`);
                }
            }
        }
        return { imported, skipped, failed };
    }
    async processMetaApiDeal(account, deal, connection, existingTrade, externalIdOverride) {
        const externalId = externalIdOverride || deal.positionId?.toString();
        if (!externalId)
            return { status: 'skipped' };
        const side = this.mapDealSide(deal);
        if (!side)
            return { status: 'skipped' };
        if (!deal.symbol)
            return { status: 'skipped' };
        const tradeRecord = existingTrade ||
            (await this.tradesService.findOneByExternalId(account.userId, externalId, account.id));
        const entryType = (deal.entryType || '').toUpperCase();
        const isEntry = entryType === 'DEAL_ENTRY_IN';
        const isExit = entryType === 'DEAL_ENTRY_OUT' || entryType === 'DEAL_ENTRY_OUT_BY';
        const isInOut = entryType === 'DEAL_ENTRY_INOUT';
        const shouldTreatAsEntry = isEntry || (isInOut && !tradeRecord);
        const shouldTreatAsExit = isExit || (isInOut && !!tradeRecord);
        const openTime = deal.time
            ? deal.time.toISOString()
            : new Date().toISOString();
        const price = deal.price || 0;
        const contractSize = this.getContractSize(connection, deal.symbol);
        const dealNotes = deal.comment
            ? `MetaApi Position ID: ${externalId} | ${deal.comment}`
            : `Auto-synced via MetaApi Position ID: ${externalId}`;
        const closeReason = this.mapDealReason(deal.reason);
        if (shouldTreatAsEntry) {
            if (tradeRecord) {
                const updates = {};
                if (!tradeRecord.openTime && openTime)
                    updates.openTime = openTime;
                if (!tradeRecord.openPrice && price)
                    updates.openPrice = price;
                if (!tradeRecord.quantity && deal.volume)
                    updates.quantity = deal.volume;
                if (!tradeRecord.side)
                    updates.side = side;
                if (contractSize && !tradeRecord.contractSize)
                    updates.contractSize = contractSize;
                if (!tradeRecord.externalDealId)
                    updates.externalDealId = deal.id;
                if (!tradeRecord.mt5Magic && deal.magic)
                    updates.mt5Magic = deal.magic;
                if (deal.stopLoss !== undefined && deal.stopLoss !== null && deal.stopLoss !== 0)
                    updates.stopLoss = deal.stopLoss;
                if (deal.takeProfit !== undefined && deal.takeProfit !== null && deal.takeProfit !== 0)
                    updates.takeProfit = deal.takeProfit;
                if (!tradeRecord.notes && deal.comment)
                    updates.notes = dealNotes;
                if (Object.keys(updates).length > 0) {
                    const updatedTrade = await this.tradesService.updateFromSync(tradeRecord.id, updates, { source: 'mt5', changes: {}, note: 'MetaApi entry update' });
                    return { status: 'imported', trade: updatedTrade };
                }
                return { status: 'skipped' };
            }
            const createdTrade = await this.tradesService.create({
                symbol: deal.symbol,
                assetType: this.detectAssetType(deal.symbol),
                side,
                status: enums_1.TradeStatus.OPEN,
                openTime,
                openPrice: price,
                quantity: deal.volume || 0,
                commission: deal.commission || 0,
                swap: deal.swap || 0,
                notes: dealNotes,
                accountId: account.id,
                externalId,
                externalDealId: deal.id,
                mt5Magic: deal.magic,
                contractSize,
                syncSource: 'metaapi',
                stopLoss: (deal.stopLoss && deal.stopLoss !== 0) ? deal.stopLoss : undefined,
                takeProfit: (deal.takeProfit && deal.takeProfit !== 0) ? deal.takeProfit : undefined,
            }, { id: account.userId });
            return { status: 'imported', trade: createdTrade };
        }
        if (shouldTreatAsExit) {
            if (tradeRecord) {
                const enrichedSl = !tradeRecord.stopLoss && deal.stopLoss && deal.stopLoss !== 0
                    ? deal.stopLoss
                    : undefined;
                const enrichedTp = !tradeRecord.takeProfit && deal.takeProfit && deal.takeProfit !== 0
                    ? deal.takeProfit
                    : undefined;
                const updatedTrade = await this.tradesService.update(tradeRecord.id, {
                    status: enums_1.TradeStatus.CLOSED,
                    closeTime: openTime,
                    closePrice: price,
                    profitOrLoss: deal.profit,
                    commission: parseFloat(String(tradeRecord.commission || 0)) +
                        (deal.commission || 0),
                    swap: parseFloat(String(tradeRecord.swap || 0)) + (deal.swap || 0),
                    contractSize: contractSize || tradeRecord.contractSize,
                    closeReason,
                    ...(enrichedSl !== undefined ? { stopLoss: enrichedSl } : {}),
                    ...(enrichedTp !== undefined ? { takeProfit: enrichedTp } : {}),
                }, { id: account.userId }, { changeSource: 'mt5' });
                if (isInOut) {
                    const closedVolume = deal.volume || 0;
                    const originalVolume = tradeRecord.quantity
                        ? parseFloat(String(tradeRecord.quantity))
                        : 0;
                    const remainingVolume = Math.round((originalVolume - closedVolume) * 100000) / 100000;
                    if (remainingVolume > 0.001) {
                        this.logger.log(`INOUT partial close: ${closedVolume} lots closed, opening new ${remainingVolume} lot position for ${deal.symbol}`);
                        await this.tradesService.create({
                            symbol: deal.symbol,
                            assetType: this.detectAssetType(deal.symbol),
                            side: tradeRecord.side,
                            status: enums_1.TradeStatus.OPEN,
                            openTime: tradeRecord.openTime || openTime,
                            openPrice: tradeRecord.openPrice || price,
                            quantity: remainingVolume,
                            stopLoss: tradeRecord.stopLoss ?? undefined,
                            takeProfit: tradeRecord.takeProfit ?? undefined,
                            notes: `Partial close remainder. Original position ID: ${externalId}. Closed ${closedVolume} lots.`,
                            accountId: account.id,
                            externalId: `${externalId}_partial_${Date.now()}`,
                            mt5Magic: deal.magic,
                            contractSize,
                            syncSource: 'metaapi',
                        }, { id: account.userId });
                    }
                }
                return { status: 'imported', trade: updatedTrade };
            }
            const inferredSide = side === enums_1.TradeDirection.LONG
                ? enums_1.TradeDirection.SHORT
                : enums_1.TradeDirection.LONG;
            const createdTrade = await this.tradesService.create({
                symbol: deal.symbol,
                assetType: this.detectAssetType(deal.symbol),
                side: inferredSide,
                status: enums_1.TradeStatus.CLOSED,
                openTime,
                closeTime: openTime,
                openPrice: 0,
                closePrice: price,
                quantity: deal.volume || 0,
                profitOrLoss: deal.profit,
                commission: deal.commission || 0,
                swap: deal.swap || 0,
                notes: `Orphan Exit Synced (Entry missing). Position ID: ${externalId}${deal.comment ? ' | ' + deal.comment : ''}`,
                accountId: account.id,
                externalId,
                externalDealId: deal.id,
                mt5Magic: deal.magic,
                contractSize,
                syncSource: 'metaapi',
                closeReason,
            }, { id: account.userId });
            return { status: 'imported', trade: createdTrade };
        }
        return { status: 'skipped' };
    }
    mapDealReason(reason) {
        if (!reason)
            return undefined;
        const reasonMap = {
            DEAL_REASON_CLIENT: 'Manual (Desktop)',
            DEAL_REASON_MOBILE: 'Manual (Mobile)',
            DEAL_REASON_WEB: 'Manual (Web)',
            DEAL_REASON_EXPERT: 'Expert Advisor',
            DEAL_REASON_SL: 'Stop Loss',
            DEAL_REASON_TP: 'Take Profit',
            DEAL_REASON_SO: 'Stop Out',
            DEAL_REASON_ROLLOVER: 'Rollover',
            DEAL_REASON_VMARGIN: 'Variation Margin',
            DEAL_REASON_SPLIT: 'Stock Split',
        };
        return reasonMap[reason.toUpperCase()] || reason;
    }
    isSupportedDealType(deal) {
        const type = (deal.type || '').toUpperCase();
        return type === 'DEAL_TYPE_BUY' || type === 'DEAL_TYPE_SELL';
    }
    mapDealSide(deal) {
        const type = (deal.type || '').toUpperCase();
        if (type === 'DEAL_TYPE_BUY')
            return enums_1.TradeDirection.LONG;
        if (type === 'DEAL_TYPE_SELL')
            return enums_1.TradeDirection.SHORT;
        return null;
    }
    getContractSize(connection, symbol) {
        try {
            const specification = connection.terminalState.specification(symbol);
            return specification?.contractSize;
        }
        catch {
            return undefined;
        }
    }
    detectAssetType(symbol) {
        const upper = symbol.toUpperCase();
        const forexPairs = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
        const forexMatch = forexPairs.filter((c) => upper.includes(c)).length >= 2;
        if (forexMatch && upper.length <= 7)
            return enums_1.AssetType.FOREX;
        if (upper.includes('BTC') || upper.includes('ETH'))
            return enums_1.AssetType.CRYPTO;
        if (upper.includes('XAU') || upper.includes('GOLD'))
            return enums_1.AssetType.COMMODITIES;
        const indices = [
            'US30',
            'DJ30',
            'NAS100',
            'NDX',
            'SPX',
            'SP500',
            'GER30',
            'DE30',
            'UK100',
            'JP225',
        ];
        if (indices.some((i) => upper.includes(i)))
            return enums_1.AssetType.INDICES;
        return enums_1.AssetType.FOREX;
    }
    mapToListDto(account) {
        const isManual = account.metadata?.isManual || account.connectionStatus === 'manual';
        const { password, login, server, ...rest } = account;
        return {
            ...rest,
            login: isManual ? login : '[Protected]',
            server: isManual ? server : '[Protected]',
        };
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
    async getConnectionStatus(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        return {
            state: account.deploymentState || 'MANUAL',
            connectionStatus: account.connectionStatus || 'disconnected',
            deployed: account.deploymentState === 'DEPLOYED',
            autoSyncEnabled: !!account.autoSyncEnabled,
            isStreamingActive: !!account.isStreamingActive,
            lastSyncAt: account.lastSyncAt ?? undefined,
            lastSyncError: account.lastSyncError ?? undefined,
        };
    }
    async setDefaultAccount(id, userId) {
        const account = await this.mt5AccountRepository.findOne({ where: { id, userId } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found or doesn't belong to the user`);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.update(mt5_account_entity_1.MT5Account, { userId, isDefault: true }, { isDefault: false });
            await queryRunner.manager.update(mt5_account_entity_1.MT5Account, { id }, { isDefault: true });
            await queryRunner.commitTransaction();
            const updatedAccount = await this.mt5AccountRepository.findOne({ where: { id } });
            return this.mapToResponseDto(updatedAccount);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to set default account: ${err.message}`, err.stack);
            throw new common_1.InternalServerErrorException('Failed to set default account');
        }
        finally {
            await queryRunner.release();
        }
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
        mt5_positions_gateway_1.MT5PositionsGateway,
        typeorm_2.DataSource])
], MT5AccountsService);
class MetaApiSyncListener extends metaapi_cloud_sdk_1.SynchronizationListener {
    handlers;
    logger;
    constructor(handlers, logger) {
        super();
        this.handlers = handlers;
        this.logger = logger;
    }
    async onConnected(instanceIndex, replicas) {
        try {
            await this.handlers.onConnected?.();
        }
        catch (error) {
            this.logger.warn(`MetaApi onConnected handler failed: ${error.message}`);
        }
    }
    async onDisconnected(instanceIndex) {
        try {
            await this.handlers.onDisconnected?.();
        }
        catch (error) {
            this.logger.warn(`MetaApi onDisconnected handler failed: ${error.message}`);
        }
    }
    async onAccountInformationUpdated(instanceIndex, accountInformation) {
        try {
            await this.handlers.onAccountInformationUpdated?.(accountInformation);
        }
        catch (error) {
            this.logger.warn(`MetaApi account info handler failed: ${error.message}`);
        }
    }
    async onPositionsReplaced(instanceIndex, positions) {
        try {
            await this.handlers.onPositionsReplaced?.(positions);
        }
        catch (error) {
            this.logger.warn(`MetaApi positions replace handler failed: ${error.message}`);
        }
    }
    async onPositionUpdated(instanceIndex, position) {
        try {
            await this.handlers.onPositionUpdated?.(position);
        }
        catch (error) {
            this.logger.warn(`MetaApi position update handler failed: ${error.message}`);
        }
    }
    async onDealAdded(instanceIndex, deal) {
        try {
            await this.handlers.onDealAdded?.(deal);
        }
        catch (error) {
            this.logger.warn(`MetaApi deal handler failed: ${error.message}`);
        }
    }
}
//# sourceMappingURL=mt5-accounts.service.js.map