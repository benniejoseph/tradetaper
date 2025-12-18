"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./services/logger.service");
const global_exception_filter_1 = require("./filters/global-exception.filter");
const logging_interceptor_1 = require("./interceptors/logging.interceptor");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            logger_service_1.ProductionLoggerService,
            global_exception_filter_1.GlobalExceptionFilter,
            logging_interceptor_1.LoggingInterceptor,
        ],
        exports: [logger_service_1.ProductionLoggerService, global_exception_filter_1.GlobalExceptionFilter, logging_interceptor_1.LoggingInterceptor],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map