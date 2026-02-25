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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(registerUserDto) {
        const { email, password, firstName, lastName } = registerUserDto;
        const existingUser = await this.usersRepository.findOneBy({ email });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const username = await this.generateUniqueUsername(email);
        let user = this.usersRepository.create({
            email,
            password,
            firstName,
            lastName,
            username,
        });
        user = await this.usersRepository.save(user);
        const response = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return response;
    }
    async createGoogleUser(googleUserDto) {
        const { email, firstName, lastName } = googleUserDto;
        const existingUser = await this.usersRepository.findOneBy({ email });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const username = await this.generateUniqueUsername(email);
        const user = this.usersRepository.create({
            email,
            firstName,
            lastName,
            username,
        });
        const savedUser = await this.usersRepository.save(user);
        return savedUser;
    }
    async findOneByEmail(email) {
        const user = await this.usersRepository.findOne({
            where: { email },
            select: [
                'id',
                'email',
                'password',
                'firstName',
                'lastName',
                'username',
                'createdAt',
                'updatedAt',
            ],
        });
        return user || undefined;
    }
    async findOneById(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
        });
        if (!user) {
            return undefined;
        }
        const response = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return response;
    }
    async updateUsername(userId, username) {
        const normalized = this.normalizeUsername(username);
        if (!normalized) {
            throw new common_1.ConflictException('Invalid username');
        }
        const available = await this.isUsernameAvailable(normalized, userId);
        if (!available) {
            throw new common_1.ConflictException('Username is already taken');
        }
        await this.usersRepository.update(userId, { username: normalized });
        const updated = await this.usersRepository.findOne({
            where: { id: userId },
        });
        if (!updated) {
            throw new common_1.ConflictException('User not found');
        }
        return {
            id: updated.id,
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            username: updated.username,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
        };
    }
    async isUsernameAvailable(username, excludeUserId) {
        const normalized = this.normalizeUsername(username);
        if (!normalized)
            return false;
        const query = this.usersRepository
            .createQueryBuilder('user')
            .where('LOWER(user.username) = LOWER(:username)', {
            username: normalized,
        });
        if (excludeUserId) {
            query.andWhere('user.id != :excludeUserId', { excludeUserId });
        }
        const existing = await query.getOne();
        return !existing;
    }
    async updateLastLogin(userId) {
        await this.usersRepository.update(userId, {
            lastLoginAt: new Date(),
        });
    }
    normalizeUsername(raw) {
        if (!raw)
            return '';
        let candidate = raw.toLowerCase().trim();
        candidate = candidate.replace(/[^a-z0-9_]/g, '');
        if (!candidate)
            return '';
        if (!/^[a-z]/.test(candidate)) {
            candidate = `trader${candidate}`;
        }
        return candidate.slice(0, 20);
    }
    async generateUniqueUsername(email) {
        const base = this.normalizeUsername(email.split('@')[0]) || 'trader';
        let candidate = base;
        let suffix = 0;
        while (!(await this.isUsernameAvailable(candidate))) {
            suffix += 1;
            candidate = `${base}${suffix}`;
            if (candidate.length > 20) {
                candidate = `${base.slice(0, 18)}${suffix}`;
            }
        }
        return candidate;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map