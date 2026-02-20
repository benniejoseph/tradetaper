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
const logger = new common_1.Logger('Bootstrap');
async function bootstrap() {
    try {
        logger.log('TradeTaper Backend Starting...');
        logger.log(`Node.js: ${process.version}, ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT}`);
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        const corsOptions = {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3002',
                'https://tradetaper.com',
                'https://www.tradetaper.com',
                'https://api.tradetaper.com',
                'https://tradetaper-frontend.vercel.app',
                'https://tradetaper-admin.vercel.app',
                ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
                process.env.FRONTEND_URL || 'https://tradetaper.com',
            ],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-CSRF-Token',
                'CSRF-Token',
                'x-csrf-token',
            ],
            credentials: true,
        };
        app.enableCors(corsOptions);
        logger.log(`CORS enabled for origins: ${JSON.stringify(corsOptions.origin)}`);
        app.useWebSocketAdapter(new ws_jwt_adapter_1.WsJwtAdapter(app));
        logger.log('WebSocket JWT authentication enabled');
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
        logger.log('Security headers enabled (Helmet.js)');
        app.use((0, cookie_parser_1.default)());
        logger.log('Cookie parser enabled');
        const enableCsrf = process.env.ENABLE_CSRF === 'true' ||
            process.env.NODE_ENV === 'production';
        if (enableCsrf) {
            const { doubleCsrfProtection } = (0, csrf_csrf_1.doubleCsrf)({
                getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
                cookieName: '__Host-csrf',
                cookieOptions: {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
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
            app.use((req, res, next) => {
                if (req.path && req.path.includes('/api/v1/webhook')) {
                    next();
                }
                else {
                    doubleCsrfProtection(req, res, next);
                }
            });
            logger.log('CSRF protection enabled');
        }
        else {
            logger.warn('CSRF protection disabled (set ENABLE_CSRF=true to enable)');
        }
        const port = process.env.PORT || 3000;
        logger.log(`Using port: ${port}`);
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
                logger.error(`Validation failed: ${JSON.stringify(messages, null, 2)}`);
                return new common_1.BadRequestException(messages);
            },
        }));
        logger.log(`Starting server on port ${port}...`);
        await app.listen(port, '0.0.0.0');
        logger.log(`TradeTaper Backend is running on port ${port}`);
        logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.log(`Health: http://0.0.0.0:${port}/health`);
        logger.log(`API: http://0.0.0.0:${port}/api/v1`);
        logger.log(`Application is running on: ${await app.getUrl()}`);
    }
    catch (error) {
        const err = error;
        logger.fatal(`STARTUP FAILED: ${err.message}`, err.stack);
        process.exit(1);
    }
}
process.on('uncaughtException', (error) => {
    logger.fatal(`Uncaught Exception: ${error.message}`, error.stack);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger.fatal(`Unhandled Rejection: ${reason}`);
    process.exit(1);
});
process.on('SIGTERM', () => {
    logger.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
void bootstrap();
//# sourceMappingURL=main.js.map