"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const csrf_csrf_1 = require("csrf-csrf");
const helmet_1 = __importDefault(require("helmet"));
const ws_jwt_adapter_1 = require("./websocket/ws-jwt.adapter");
async function bootstrap() {
    try {
        console.log('🚀 TradeTaper Backend Starting...');
        console.log(`📊 Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`);
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.useWebSocketAdapter(new ws_jwt_adapter_1.WsJwtAdapter(app));
        console.log('🔐 WebSocket JWT authentication enabled');
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'", 'https://api.tradetaper.com'],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));
        console.log('🛡️  Security headers enabled (Helmet.js)');
        app.use((0, cookie_parser_1.default)());
        console.log('🍪 Cookie parser enabled');
        const enableCsrf = process.env.ENABLE_CSRF === 'true' ||
            process.env.NODE_ENV === 'production';
        if (enableCsrf) {
            const { doubleCsrfProtection } = (0, csrf_csrf_1.doubleCsrf)({
                getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
                cookieName: '__Host-csrf',
                cookieOptions: {
                    httpOnly: true,
                    sameSite: 'strict',
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                },
                size: 64,
                ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
                getSessionIdentifier: (req) => {
                    return req.cookies?.['connect.sid'] || req.cookies?.['session'] || '';
                },
                getCsrfTokenFromRequest: (req) => {
                    return (req.headers['x-csrf-token'] ||
                        req.headers['csrf-token'] ||
                        req.body?._csrf ||
                        req.query?._csrf);
                },
            });
            app.use(doubleCsrfProtection);
            console.log('🛡️  CSRF protection enabled');
        }
        else {
            console.log('⚠️  CSRF protection disabled (set ENABLE_CSRF=true to enable)');
        }
        const port = process.env.PORT || 3000;
        console.log(`🔧 Using port: ${port}`);
        const corsOptions = {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3002',
                'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
                'https://tradetaper-frontend.vercel.app',
                'https://tradetaper-admin.vercel.app',
                'https://api.tradetaper.com',
                'https://tradetaper.com',
                'https://www.tradetaper.com',
                'https://api.tradetaper.com',
                process.env.FRONTEND_URL || 'https://tradetaper.com',
            ],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-CSRF-Token',
                'CSRF-Token',
            ],
            credentials: true,
        };
        app.enableCors(corsOptions);
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            exceptionFactory: (errors) => {
                const messages = errors.map((error) => ({
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