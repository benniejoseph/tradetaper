// src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity'; // Adjust path as needed

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Tell passport-local to use 'email' as the username
  }

  async validate(email: string, pass: string): Promise<Omit<User, 'password' | 'hashPassword' | 'validatePassword'>> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Return user object without password or methods, as these are not needed after validation
    // and JWT will store minimal info.
    const { password, hashPassword, validatePassword, ...result } = user;
    return result;
  }
}