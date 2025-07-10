import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private authService;
    private jwtService;
    private configService;
    constructor(authService: AuthService, jwtService: JwtService, configService: ConfigService);
    register(registerUserDto: RegisterUserDto): Promise<UserResponseDto>;
    login(loginUserDto: LoginUserDto): Promise<{
        accessToken: string;
        user: UserResponseDto;
    }>;
    googleAuth(res: any): Promise<any>;
    googleCallback(query: any, res: any): Promise<any>;
    private exchangeCodeForTokens;
    private getUserInfo;
    debugGoogleConfig(): Promise<{
        hasClientId: boolean;
        hasClientSecret: boolean;
        hasCallbackUrl: boolean;
        callbackUrl: string | undefined;
    }>;
    testRoute(): Promise<{
        message: string;
        timestamp: string;
    }>;
    adminLogin(loginDto: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: any;
    }>;
    getProfile(req: any): UserResponseDto;
    testOauthRoutes(): Promise<{
        message: string;
        routes: string[];
        timestamp: string;
    }>;
}
