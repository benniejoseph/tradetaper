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
let MT5AccountsService = MT5AccountsService_1 = class MT5AccountsService {
    mt5AccountRepository;
    userRepository;
    configService;
    tradesService;
    logger = new common_1.Logger(MT5AccountsService_1.name);
    encryptionKey;
    encryptionIV;
    constructor(mt5AccountRepository, userRepository, configService, tradesService) {
        this.mt5AccountRepository = mt5AccountRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.tradesService = tradesService;
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
    async syncAccount(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        this.logger.log(`Sync requested for account ${id} - FTP sync not yet implemented`);
        throw new common_1.UnprocessableEntityException('Auto-sync via FTP is coming soon. Please use manual file upload for now.');
    }
    async getConnectionStatus(id) {
        const account = await this.mt5AccountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`MT5 account with id ${id} not found`);
        }
        const ftpConfigured = false;
        return {
            state: account.deploymentState || 'MANUAL',
            connectionStatus: account.connectionStatus || 'disconnected',
            deployed: false,
            ftpConfigured,
        };
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
        trades_service_1.TradesService])
], MT5AccountsService);
//# sourceMappingURL=mt5-accounts.service.js.map