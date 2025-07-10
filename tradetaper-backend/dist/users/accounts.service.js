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
var AccountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("./entities/account.entity");
let AccountsService = AccountsService_1 = class AccountsService {
    accountRepository;
    logger = new common_1.Logger(AccountsService_1.name);
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async create(createAccountDto, user) {
        this.logger.log(`Creating account for user ${user.id}`);
        const account = this.accountRepository.create({
            ...createAccountDto,
            userId: user.id,
            currency: createAccountDto.currency || 'USD',
            isActive: createAccountDto.isActive ?? true,
        });
        const savedAccount = await this.accountRepository.save(account);
        return this.mapToResponseDto(savedAccount);
    }
    async findAllByUser(userId) {
        const accounts = await this.accountRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        return accounts.map(account => this.mapToResponseDto(account));
    }
    async findOne(id) {
        return this.accountRepository.findOne({
            where: { id },
        });
    }
    async update(id, updateAccountDto) {
        const account = await this.accountRepository.findOne({
            where: { id },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Account with id ${id} not found`);
        }
        await this.accountRepository.update(id, updateAccountDto);
        const updatedAccount = await this.accountRepository.findOne({
            where: { id },
        });
        if (!updatedAccount) {
            throw new common_1.NotFoundException(`Account with id ${id} not found`);
        }
        return this.mapToResponseDto(updatedAccount);
    }
    async remove(id) {
        const account = await this.accountRepository.findOne({
            where: { id },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Account with id ${id} not found`);
        }
        await this.accountRepository.remove(account);
        this.logger.log(`Successfully deleted account ${id}`);
    }
    mapToResponseDto(account) {
        return {
            id: account.id,
            name: account.name,
            balance: Number(account.balance),
            currency: account.currency,
            description: account.description,
            isActive: account.isActive,
            target: Number(account.target),
            userId: account.userId,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = AccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map