import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
export declare class ManualGoogleOAuthController {
    private configService;
    private authService;
    private readonly logger;
    constructor(configService: ConfigService, authService: AuthService);
    googleAuth(res: any): Promise<any>;
    googleCallback(code: string, error: string, res: any): Promise<any>;
    private exchangeCodeForTokens;
    private getUserInfo;
    getGoogleConfig(): Promise<{
        hasClientId: boolean;
        hasClientSecret: boolean;
        hasCallbackUrl: boolean;
        callbackUrl: string | undefined;
    }>;
}
