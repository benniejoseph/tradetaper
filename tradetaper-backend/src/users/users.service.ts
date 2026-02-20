// src/users/users.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto'; // Import the DTO

interface CreateGoogleUserDto {
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
    // Return DTO
    const { email, password, firstName, lastName } = registerUserDto;

    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const username = await this.generateUniqueUsername(email);

    let user = this.usersRepository.create({
      // 'user' is of type User here
      email,
      password,
      firstName,
      lastName,
      username,
    });

    user = await this.usersRepository.save(user); // 'user' is still of type User

    // Map to DTO
    const response: UserResponseDto = {
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

  async createGoogleUser(googleUserDto: CreateGoogleUserDto): Promise<User> {
    const { email, firstName, lastName } = googleUserDto;

    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const username = await this.generateUniqueUsername(email);

    const user = this.usersRepository.create({
      email,
      // Don't set password field for Google OAuth users - leave it undefined
      firstName,
      lastName,
      username,
    });

    const savedUser = await this.usersRepository.save(user);
    return savedUser;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    // Keep returning full User for internal use (e.g., auth)
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

  async findOneById(id: string): Promise<UserResponseDto | undefined> {
    // Return DTO
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      return undefined;
    }

    // Map to DTO
    const response: UserResponseDto = {
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

  async updateUsername(userId: string, username: string): Promise<UserResponseDto> {
    const normalized = this.normalizeUsername(username);
    if (!normalized) {
      throw new ConflictException('Invalid username');
    }

    const available = await this.isUsernameAvailable(normalized, userId);
    if (!available) {
      throw new ConflictException('Username is already taken');
    }

    await this.usersRepository.update(userId, { username: normalized });
    const updated = await this.usersRepository.findOne({ where: { id: userId } });
    if (!updated) {
      throw new ConflictException('User not found');
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

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const normalized = this.normalizeUsername(username);
    if (!normalized) return false;
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username: normalized });
    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }
    const existing = await query.getOne();
    return !existing;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  private normalizeUsername(raw: string): string {
    if (!raw) return '';
    let candidate = raw.toLowerCase().trim();
    candidate = candidate.replace(/[^a-z0-9_]/g, '');
    if (!candidate) return '';
    if (!/^[a-z]/.test(candidate)) {
      candidate = `trader${candidate}`;
    }
    return candidate.slice(0, 20);
  }

  private async generateUniqueUsername(email: string): Promise<string> {
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
}
