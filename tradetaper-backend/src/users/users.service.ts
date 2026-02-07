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
  referralCode?: string;
}

function generateReferralCode(length = 8) {
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
   let result = '';
   for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   return result;
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

    // Generate unique referral code
    let newReferralCode = generateReferralCode();
    // Simple collision check (in prod, use a loop or better ID gen)
    while (await this.usersRepository.findOneBy({ referralCode: newReferralCode })) {
        newReferralCode = generateReferralCode();
    }

    let referredBy: string | undefined = undefined;
    if (registerUserDto.referralCode) {
        const referrer = await this.usersRepository.findOneBy({ referralCode: registerUserDto.referralCode });
        if (referrer) {
            referredBy = referrer.referralCode;
            // Increment referral count
            referrer.referralCount = (referrer.referralCount || 0) + 1;
            await this.usersRepository.save(referrer);
        }
    }

    let user = this.usersRepository.create({
      // 'user' is of type User here
      email,
      password,
      firstName,
      lastName,
      referralCode: newReferralCode,
      referredBy,
    });

    user = await this.usersRepository.save(user); // 'user' is still of type User

    // Map to DTO
    const response: UserResponseDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
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

    // Generate unique referral code
    let newReferralCode = generateReferralCode();
    while (await this.usersRepository.findOneBy({ referralCode: newReferralCode })) {
        newReferralCode = generateReferralCode();
    }
    
    let referredBy: string | undefined = undefined;
    if (googleUserDto.referralCode) {
         const referrer = await this.usersRepository.findOneBy({ referralCode: googleUserDto.referralCode });
         if (referrer) {
             referredBy = referrer.referralCode;
             referrer.referralCount = (referrer.referralCount || 0) + 1;
             await this.usersRepository.save(referrer);
         }
    }

    const user = this.usersRepository.create({
      email,
      // Don't set password field for Google OAuth users - leave it undefined
      firstName,
      lastName,
      referralCode: newReferralCode,
      referredBy,
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return response;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }
}
