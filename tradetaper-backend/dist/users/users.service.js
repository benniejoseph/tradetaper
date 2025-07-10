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
        let user = this.usersRepository.create({
            email,
            password,
            firstName,
            lastName,
        });
        user = await this.usersRepository.save(user);
        const response = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
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
        const user = this.usersRepository.create({
            email,
            firstName,
            lastName,
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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return response;
    }
    async updateLastLogin(userId) {
        await this.usersRepository.update(userId, {
            lastLoginAt: new Date(),
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map