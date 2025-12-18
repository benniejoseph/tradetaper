import { AppService } from './app.service';
import { DataSource } from 'typeorm';
export declare class AppController {
    private readonly appService;
    private dataSource;
    constructor(appService: AppService, dataSource: DataSource);
    getHello(): string;
    healthCheck(): Promise<{
        status: string;
        db: string;
        details?: undefined;
    } | {
        status: string;
        db: string;
        details: any;
    }>;
}
