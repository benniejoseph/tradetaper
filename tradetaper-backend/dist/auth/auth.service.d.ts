import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { SubscriptionService } from '../subscriptions/services/subscription.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private subscriptionService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, subscriptionService: SubscriptionService);
    validateUser(email: string, pass: string): Promise<User | null>;
    validateOrCreateGoogleUser(googleUser: {
        email: string;
        firstName: string;
        lastName: string;
        picture: string;
        accessToken?: string;
        googleId?: string;
        refreshToken?: string;
    }): Promise<{
        accessToken: string;
        user: UserResponseDto;
    }>;
    login(user: User): Promise<{
        accessToken: string;
        user: UserResponseDto;
    }>;
    register(registerUserDto: RegisterUserDto): Promise<UserResponseDto>;
}
