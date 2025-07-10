import { AppService } from './app.service';
import { DataSource } from 'typeorm';
export declare class AppController {
    private readonly appService;
    private dataSource;
    constructor(appService: AppService, dataSource: DataSource);
    getHello(): string;
    getTestMessage(): {
        message: string;
    };
    ping(): {
        message: string;
        timestamp: string;
        environment: string;
        version: string;
        database: {
            url: string;
            type: string;
        };
        deployment: {
            platform: string;
            region: string;
        };
    };
    health(): {
        status: string;
        timestamp: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
    };
    testDeployment(): {
        message: string;
        timestamp: string;
        version: string;
        environment: string;
        features: string[];
    };
    railwayHealth(): {
        status: string;
        message: string;
        timestamp: string;
        environment: string;
    };
    validateStripe(): Promise<{
        message: string;
        status: string;
    }>;
    runMigrationsGet(): Promise<{
        success: boolean;
        message: string;
        migrations: string[];
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        timestamp: string;
        migrations?: undefined;
    }>;
    runMigrations(): Promise<{
        success: boolean;
        message: string;
        migrations: string[];
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        migrations?: undefined;
    }>;
}
