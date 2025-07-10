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
var TradeHistoryParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeHistoryParserService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
let TradeHistoryParserService = TradeHistoryParserService_1 = class TradeHistoryParserService {
    logger = new common_1.Logger(TradeHistoryParserService_1.name);
    async parseTradeHistory(buffer, fileType, fileName) {
        this.logger.log(`Parsing ${fileType.toUpperCase()} trade history file: ${fileName}`);
        try {
            if (fileType === 'html') {
                return this.parseHTMLTradeHistory(buffer);
            }
            else if (fileType === 'xlsx') {
                return this.parseExcelTradeHistory(buffer);
            }
            else {
                throw new common_1.BadRequestException('Unsupported file type. Only HTML and XLSX files are supported.');
            }
        }
        catch (error) {
            this.logger.error(`Failed to parse trade history file ${fileName}:`, error);
            throw new common_1.BadRequestException(`Failed to parse trade history: ${error.message}`);
        }
    }
    parseHTMLTradeHistory(buffer) {
        let html;
        if (buffer[0] === 0xff && buffer[1] === 0xfe) {
            html = buffer.toString('utf16le');
        }
        else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
            html = buffer.toString('utf16le');
        }
        else {
            html = buffer.toString('utf8');
        }
        const trades = [];
        let accountBalance;
        let accountCurrency;
        let totalNetProfit;
        let equity;
        const balanceRegex = /balance[^\d]*([\d,.]+)\s*([A-Z]{3})/i;
        const balanceMatch = html.match(balanceRegex);
        if (balanceMatch) {
            accountBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
            accountCurrency = balanceMatch[2];
            this.logger.log(`Extracted account balance from header: ${accountBalance} ${accountCurrency}`);
        }
        const summaryBalanceRegex = /<td[^>]*>Balance:<\/td>\s*<td[^>]*><b>([\d,.\s-]+)<\/b><\/td>/i;
        const totalNetProfitRegex = /<td[^>]*>Total Net Profit:<\/td>\s*<td[^>]*><b>([\d,.\s-]+)<\/b><\/td>/i;
        const equityRegex = /<td[^>]*>Equity:<\/td>\s*<td[^>]*><b>([\d,.\s-]+)<\/b><\/td>/i;
        const summaryBalanceMatch = html.match(summaryBalanceRegex);
        if (summaryBalanceMatch) {
            const summaryBalance = parseFloat(summaryBalanceMatch[1].replace(/[,\s]/g, ''));
            if (!isNaN(summaryBalance)) {
                accountBalance = summaryBalance;
                this.logger.log(`Extracted account balance from summary: ${accountBalance}`);
            }
        }
        const netProfitMatch = html.match(totalNetProfitRegex);
        if (netProfitMatch) {
            totalNetProfit = parseFloat(netProfitMatch[1].replace(/[,\s]/g, ''));
            this.logger.log(`Extracted total net profit: ${totalNetProfit}`);
        }
        const equityMatch = html.match(equityRegex);
        if (equityMatch) {
            equity = parseFloat(equityMatch[1].replace(/[,\s]/g, ''));
            this.logger.log(`Extracted equity: ${equity}`);
        }
        const tableRowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
        const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis;
        let match;
        let headerFound = false;
        const columnMap = {};
        while ((match = tableRowRegex.exec(html)) !== null) {
            const rowHtml = match[1];
            const cells = [];
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
                const cellContent = cellMatch[1]
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .trim();
                cells.push(cellContent);
            }
            if (cells.length === 0)
                continue;
            const rowText = cells.join(' ').toLowerCase();
            if (!headerFound &&
                rowText.includes('position') &&
                rowText.includes('symbol') &&
                rowText.includes('type')) {
                headerFound = true;
                this.logger.log('Found header row in HTML');
                cells.forEach((header, index) => {
                    const headerText = header.toLowerCase();
                    if (headerText.includes('position'))
                        columnMap.position = index;
                    if (headerText.includes('symbol'))
                        columnMap.symbol = index;
                    if (headerText.includes('type'))
                        columnMap.type = index;
                    if (headerText.includes('volume'))
                        columnMap.volume = index;
                    if (headerText.includes('price') &&
                        !headerText.includes('s / l') &&
                        !headerText.includes('t / p')) {
                        if (!columnMap.openPrice)
                            columnMap.openPrice = index;
                        else if (!columnMap.closePrice)
                            columnMap.closePrice = index;
                    }
                    if (headerText.includes('time')) {
                        if (!columnMap.openTime)
                            columnMap.openTime = index;
                        else if (!columnMap.closeTime)
                            columnMap.closeTime = index;
                    }
                    if (headerText.includes('commission'))
                        columnMap.commission = index;
                    if (headerText.includes('swap'))
                        columnMap.swap = index;
                    if (headerText.includes('profit'))
                        columnMap.profit = index;
                });
                this.logger.log('Column mapping:', columnMap);
                continue;
            }
            if (headerFound && cells.length > 5) {
                const openTime = this.parseDateTime(cells[0] || '');
                const positionId = cells[1] || '';
                const symbol = cells[2] || '';
                const type = (cells[3] || '').toLowerCase();
                const volume = parseFloat(cells[5] || '0');
                const openPrice = parseFloat(cells[6] || '0');
                const closeTime = this.parseDateTime(cells[9] || '');
                const closePrice = parseFloat(cells[10] || '0');
                const commission = parseFloat(cells[11] || '0');
                const swap = parseFloat(cells[12] || '0');
                const profit = parseFloat(cells[13] || '0');
                if (positionId &&
                    symbol &&
                    (type === 'buy' || type === 'sell') &&
                    !isNaN(openPrice) &&
                    !isNaN(closePrice) &&
                    openTime &&
                    closeTime &&
                    !isNaN(profit)) {
                    trades.push({
                        positionId,
                        symbol,
                        type: type,
                        volume,
                        openPrice,
                        closePrice,
                        openTime,
                        closeTime,
                        profit,
                        commission,
                        swap,
                        comment: '',
                    });
                }
            }
        }
        this.logger.log(`Parsed ${trades.length} trades from HTML file`);
        return { trades, accountBalance, accountCurrency, totalNetProfit, equity };
    }
    parseExcelTradeHistory(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const trades = [];
        let accountBalance;
        let accountCurrency;
        let totalNetProfit;
        let equity;
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
            });
            for (let i = 0; i < Math.min(sheetData.length, 10); i++) {
                const row = sheetData[i];
                if (!row)
                    continue;
                const rowText = row.join(' ').toLowerCase();
                if (rowText.includes('balance') && !accountBalance) {
                    for (let j = 0; j < row.length; j++) {
                        const cell = (row[j] || '').toString();
                        if (cell &&
                            typeof cell === 'string' &&
                            cell.toLowerCase().includes('balance')) {
                            if (j + 1 < row.length) {
                                const balanceValue = parseFloat((row[j + 1] || '').toString().replace(/,/g, ''));
                                if (!isNaN(balanceValue)) {
                                    accountBalance = balanceValue;
                                    this.logger.log(`Extracted account balance: ${accountBalance}`);
                                }
                            }
                        }
                    }
                }
                if (rowText.includes('currency') && !accountCurrency) {
                    for (let j = 0; j < row.length; j++) {
                        const cell = (row[j] || '').toString();
                        if (cell &&
                            typeof cell === 'string' &&
                            cell.toLowerCase().includes('currency')) {
                            if (j + 1 < row.length) {
                                const currencyValue = (row[j + 1] || '').toString().trim();
                                if (currencyValue && currencyValue.length === 3) {
                                    accountCurrency = currencyValue.toUpperCase();
                                    this.logger.log(`Extracted account currency: ${accountCurrency}`);
                                }
                            }
                        }
                    }
                }
            }
            let headerRowIndex = -1;
            const columnMap = {};
            for (let i = 0; i < Math.min(sheetData.length, 10); i++) {
                const row = sheetData[i];
                if (!row)
                    continue;
                const rowText = row.join(' ').toLowerCase();
                if (rowText.includes('position') &&
                    rowText.includes('symbol') &&
                    rowText.includes('type')) {
                    headerRowIndex = i;
                    row.forEach((header, index) => {
                        const headerText = (header || '').toString().toLowerCase().trim();
                        if (headerText === 'position')
                            columnMap.position = index;
                        if (headerText === 'symbol')
                            columnMap.symbol = index;
                        if (headerText === 'type')
                            columnMap.type = index;
                        if (headerText === 'volume')
                            columnMap.volume = index;
                        if (headerText === 'commission')
                            columnMap.commission = index;
                        if (headerText === 'swap')
                            columnMap.swap = index;
                        if (headerText === 'profit')
                            columnMap.profit = index;
                    });
                    let timeCount = 0;
                    let priceCount = 0;
                    row.forEach((header, index) => {
                        const headerText = (header || '').toString().toLowerCase().trim();
                        if (headerText === 'time') {
                            if (timeCount === 0) {
                                columnMap.openTime = index;
                            }
                            else if (timeCount === 1) {
                                columnMap.closeTime = index;
                            }
                            timeCount++;
                        }
                        if (headerText === 'price') {
                            if (priceCount === 0) {
                                columnMap.openPrice = index;
                            }
                            else if (priceCount === 1) {
                                columnMap.closePrice = index;
                            }
                            priceCount++;
                        }
                    });
                    break;
                }
            }
            if (headerRowIndex >= 0) {
                this.logger.log(`Found trade data in sheet: ${sheetName}`);
                this.logger.log('Column mapping:', columnMap);
                for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
                    const row = sheetData[i];
                    if (!row || row.length === 0)
                        continue;
                    const openTime = this.parseExcelDateTime(row[0]);
                    const positionId = (row[1] || '').toString().trim();
                    const symbol = (row[2] || '').toString().trim();
                    const type = (row[3] || '').toString().trim().toLowerCase();
                    const volume = parseFloat(row[4] || '0');
                    const openPrice = parseFloat(row[5] || '0');
                    const closeTime = this.parseExcelDateTime(row[8]);
                    const closePrice = parseFloat(row[9] || '0');
                    const commission = parseFloat(row[10] || '0');
                    const swap = parseFloat(row[11] || '0');
                    const profit = parseFloat(row[12] || '0');
                    if (positionId &&
                        symbol &&
                        (type === 'buy' || type === 'sell') &&
                        !isNaN(openPrice) &&
                        !isNaN(closePrice) &&
                        openTime &&
                        closeTime &&
                        !isNaN(profit)) {
                        trades.push({
                            positionId,
                            symbol,
                            type: type,
                            volume,
                            openPrice,
                            closePrice,
                            openTime,
                            closeTime,
                            profit,
                            commission,
                            swap,
                            comment: '',
                        });
                    }
                }
                this.logger.log(`Scanning for summary data in sheet: ${sheetName}`);
                const startRow = Math.max(0, sheetData.length - 30);
                for (let i = startRow; i < sheetData.length; i++) {
                    const row = sheetData[i];
                    if (!row)
                        continue;
                    for (let j = 0; j < row.length; j++) {
                        const cell = (row[j] || '').toString().toLowerCase().trim();
                        if (cell === 'balance:') {
                            for (let k = j + 1; k < Math.min(j + 5, row.length); k++) {
                                const value = parseFloat((row[k] || '').toString().replace(/,/g, ''));
                                if (!isNaN(value)) {
                                    accountBalance = value;
                                    this.logger.log(`Extracted account balance from summary: ${accountBalance}`);
                                    break;
                                }
                            }
                        }
                        if (cell === 'total net profit:') {
                            for (let k = j + 1; k < Math.min(j + 5, row.length); k++) {
                                const value = parseFloat((row[k] || '').toString().replace(/,/g, ''));
                                if (!isNaN(value)) {
                                    totalNetProfit = value;
                                    this.logger.log(`Extracted total net profit: ${totalNetProfit}`);
                                    break;
                                }
                            }
                        }
                        if (cell === 'equity:') {
                            for (let k = j + 1; k < Math.min(j + 5, row.length); k++) {
                                const value = parseFloat((row[k] || '').toString().replace(/,/g, ''));
                                if (!isNaN(value)) {
                                    equity = value;
                                    this.logger.log(`Extracted equity: ${equity}`);
                                    break;
                                }
                            }
                        }
                    }
                }
                break;
            }
        }
        this.logger.log(`Parsed ${trades.length} trades from Excel file`);
        return { trades, accountBalance, accountCurrency, totalNetProfit, equity };
    }
    parseDateTime(dateTimeStr) {
        if (!dateTimeStr || dateTimeStr.trim() === '')
            return null;
        try {
            const formats = [
                /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
                /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
                /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,
            ];
            for (const format of formats) {
                const match = dateTimeStr.match(format);
                if (match) {
                    const [, year, month, day, hour, minute, second] = match;
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
                }
            }
            const parsed = new Date(dateTimeStr);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        catch (error) {
            this.logger.warn(`Failed to parse date/time: ${dateTimeStr}`);
            return null;
        }
    }
    parseExcelDateTime(value) {
        if (!value)
            return null;
        if (value instanceof Date) {
            return value;
        }
        if (typeof value === 'number') {
            try {
                const excelEpoch = new Date(1900, 0, 1);
                const days = value - 1;
                return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
            }
            catch (error) {
                this.logger.warn(`Failed to parse Excel date: ${value}`);
                return null;
            }
        }
        return this.parseDateTime(value.toString());
    }
};
exports.TradeHistoryParserService = TradeHistoryParserService;
exports.TradeHistoryParserService = TradeHistoryParserService = TradeHistoryParserService_1 = __decorate([
    (0, common_1.Injectable)()
], TradeHistoryParserService);
//# sourceMappingURL=trade-history-parser.service.js.map