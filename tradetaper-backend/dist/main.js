"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    try {
        console.log('🚀 TradeTaper Backend Starting...');
        console.log(`📊 Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`);
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        const port = process.env.PORT || 3000;
        console.log(`🔧 Using port: ${port}`);
        const corsOptions = {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3002',
                'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
                'https://tradetaper-admin.vercel.app',
                'https://tradetaper-backend-326520250422.us-central1.run.app',
                process.env.FRONTEND_URL || 'https://tradetaper.com',
            ],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        };
        app.enableCors(corsOptions);
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            exceptionFactory: (errors) => {
                const messages = errors.map(error => ({
                    field: error.property,
                    errors: Object.values(error.constraints || {}),
                }));
                console.error('🚨 Validation failed:', JSON.stringify(messages, null, 2));
                return new common_1.BadRequestException(messages);
            },
        }));
        console.log(`🔧 Starting server on port ${port}...`);
        await app.listen(port, '0.0.0.0');
        console.log(`🚀 TradeTaper Backend is running on port ${port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`❤️ Health: http://0.0.0.0:${port}/health`);
        console.log(`📊 API: http://0.0.0.0:${port}/api/v1`);
        console.log(`Application is running on: ${await app.getUrl()}`);
    }
    catch (error) {
        console.error('❌ STARTUP FAILED:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});
void bootstrap();
//# sourceMappingURL=main.js.map