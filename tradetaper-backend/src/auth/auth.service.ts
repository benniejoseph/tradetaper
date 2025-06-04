// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service'; // Adjust path
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity'; // Adjust path
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto'; // Adjust path
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await user.validatePassword(pass))) {
      // Note: user.password is selected in findOneByEmail
      return user;
    }
    return null;
  }

  async login(
    user: User,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    // The 'user' object here comes from LocalStrategy.validate, which has already stripped the password.
    // However, for the JWT payload, we prefer to use the ID and email from the validated user.
    const validatedUser = await this.usersService.findOneByEmail(user.email); // Re-fetch to be sure
    if (!validatedUser)
      throw new UnauthorizedException('Error during login process');

    // Update lastLoginAt
    await this.usersService.updateLastLogin(validatedUser.id);

    const payload: JwtPayload = {
      email: validatedUser.email,
      sub: validatedUser.id,
    };
    const accessToken = this.jwtService.sign(payload);

    const userResponse: UserResponseDto = {
      id: validatedUser.id,
      email: validatedUser.email,
      firstName: validatedUser.firstName,
      lastName: validatedUser.lastName,
      createdAt: validatedUser.createdAt,
      updatedAt: validatedUser.updatedAt,
    };

    return {
      accessToken,
      user: userResponse,
    };
  }

  async register(registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
    const createdUser = await this.usersService.create(registerUserDto);
    // The create method in UsersService already returns UserResponseDto (or similar safe object)
    return createdUser;
  }
}
