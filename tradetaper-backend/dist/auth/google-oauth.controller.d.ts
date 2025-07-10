import { ConfigService } from '@nestjs/config';
export declare class GoogleOAuthController {
    private configService;
    constructor(configService: ConfigService);
    googleTest(): Promise<{
        message: string;
        timestamp: string;
        hasClientId: boolean;
        hasClientSecret: boolean;
        hasCallbackUrl: boolean;
        callbackUrl: string | undefined;
    }>;
    googleManual(res: any): Promise<any>;
}
