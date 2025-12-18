"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
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
                throw new Error('Unsupported export format');
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
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'TradeTaper';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Trades');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 36 },
            { header: 'Symbol', key: 'symbol', width: 12 },
            { header: 'Side', key: 'side', width: 8 },
            { header: 'Open Time', key: 'openTime', width: 20 },
            { header: 'Close Time', key: 'closeTime', width: 20 },
            { header: 'Open Price', key: 'openPrice', width: 12 },
            { header: 'Close Price', key: 'closePrice', width: 12 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Status', key: 'status', width: 10 },
            { header: 'Profit/Loss', key: 'profitOrLoss', width: 12 },
            { header: 'Commission', key: 'commission', width: 12 },
            { header: 'R Multiple', key: 'rMultiple', width: 10 },
            { header: 'Notes', key: 'notes', width: 30 },
            { header: 'Tags', key: 'tags', width: 20 },
            { header: 'Account ID', key: 'accountId', width: 36 },
            { header: 'Asset Type', key: 'assetType', width: 12 },
        ];
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        trades.forEach((trade) => {
            worksheet.addRow({
                id: trade.id,
                symbol: trade.symbol,
                side: trade.side,
                openTime: trade.openTime,
                closeTime: trade.closeTime || '',
                openPrice: trade.openPrice || '',
                closePrice: trade.closePrice || '',
                quantity: trade.quantity || '',
                status: trade.status,
                profitOrLoss: trade.profitOrLoss || '',
                commission: trade.commission || '',
                rMultiple: trade.rMultiple || '',
                notes: trade.notes || '',
                tags: trade.tags?.map((tag) => tag.name).join('; ') || '',
                accountId: trade.accountId || '',
                assetType: trade.assetType || '',
            });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = ExportService_1 = __decorate([
    (0, common_1.Injectable)()
], ExportService);
//# sourceMappingURL=export.service.js.map