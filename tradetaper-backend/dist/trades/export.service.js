"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
let ExportService = ExportService_1 = class ExportService {
    logger = new common_1.Logger(ExportService_1.name);
    async exportTrades(trades, options, userContext) {
        this.logger.log(`User ${userContext.id} exporting ${trades.length} trades as ${options.format}`);
        const timestamp = new Date().toISOString().split('T')[0];
        const accountSuffix = options.accountId ? `_${options.accountId}` : '';
        const filename = `trades_export${accountSuffix}_${timestamp}`;
        switch (options.format) {
            case 'csv':
                return {
                    data: this.generateCSV(trades),
                    filename: `${filename}.csv`,
                    mimeType: 'text/csv',
                };
            case 'json':
                return {
                    data: this.generateJSON(trades),
                    filename: `${filename}.json`,
                    mimeType: 'application/json',
                };
            case 'xlsx':
                return {
                    data: await this.generateXLSX(trades),
                    filename: `${filename}.xlsx`,
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                };
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }
    generateCSV(trades) {
        const headers = [
            'ID',
            'Symbol',
            'Side',
            'Open Time',
            'Close Time',
            'Open Price',
            'Close Price',
            'Quantity',
            'Status',
            'Profit/Loss',
            'Commission',
            'R Multiple',
            'Notes',
            'Tags',
            'Account ID',
            'Asset Type',
        ];
        const rows = trades.map((trade) => [
            trade.id,
            trade.symbol,
            trade.side,
            trade.openTime,
            trade.closeTime || '',
            trade.openPrice || '',
            trade.closePrice || '',
            trade.quantity || '',
            trade.status,
            trade.profitOrLoss || '',
            trade.commission || '',
            trade.rMultiple || '',
            trade.notes || '',
            trade.tags?.map((tag) => tag.name).join(';') || '',
            trade.accountId || '',
            trade.assetType || '',
        ]);
        const csvContent = [headers, ...rows]
            .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        return csvContent;
    }
    generateJSON(trades) {
        const exportData = {
            exportDate: new Date().toISOString(),
            totalTrades: trades.length,
            trades: trades.map((trade) => ({
                id: trade.id,
                symbol: trade.symbol,
                side: trade.side,
                openTime: trade.openTime,
                closeTime: trade.closeTime,
                openPrice: trade.openPrice,
                closePrice: trade.closePrice,
                quantity: trade.quantity,
                status: trade.status,
                profitOrLoss: trade.profitOrLoss,
                commission: trade.commission,
                rMultiple: trade.rMultiple,
                notes: trade.notes,
                tags: trade.tags?.map((tag) => tag.name) || [],
                accountId: trade.accountId,
                assetType: trade.assetType,
                createdAt: trade.createdAt,
                updatedAt: trade.updatedAt,
            })),
        };
        return JSON.stringify(exportData, null, 2);
    }
    async generateXLSX(trades) {
        const csvData = this.generateCSV(trades);
        return Buffer.from(csvData, 'utf-8');
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = ExportService_1 = __decorate([
    (0, common_1.Injectable)()
], ExportService);
//# sourceMappingURL=export.service.js.map