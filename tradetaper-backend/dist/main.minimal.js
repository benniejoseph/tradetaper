"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_minimal_1 = require("./app.module.minimal");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    try {
        console.log('🚀 Starting TradeTaper Admin API...');
        console.log(`📊 Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`);
        const app = await core_1.NestFactory.create(app_module_minimal_1.AppModule, {
            logger: ['log', 'error', 'warn'],
        });
        const port = process.env.PORT;
        if (!port) {
            console.error('PORT environment variable is not set.');
            process.exit(1);
        }
        app.enableCors({
            origin: [
                'https://tradetaper-admin.vercel.app',
                'http://localhost:3000',
                'http://localhost:3001'
            ],
            credentials: true
        });
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false
        }));
        console.log(`🔧 Starting server on port ${port}...`);
        await app.listen(port, '0.0.0.0');
        console.log('✅ TradeTaper Admin API STARTED!');
        console.log(`🔗 API Base: http://0.0.0.0:${port}/api/v1`);
        console.log(`📊 Admin: http://0.0.0.0:${port}/api/v1/admin/dashboard/stats`);
    }
    catch (error) {
        console.error('❌ STARTUP FAILED:', error.message);
        console.error(error.stack);
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
void bootstrap();
//# sourceMappingURL=main.minimal.js.map