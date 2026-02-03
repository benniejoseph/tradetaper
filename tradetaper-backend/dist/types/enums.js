"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketSentiment = exports.MarketMovementType = exports.ICTConcept = exports.TradingSession = exports.TradeStatus = exports.TradeDirection = exports.AssetType = void 0;
var AssetType;
(function (AssetType) {
    AssetType["STOCK"] = "Stock";
    AssetType["CRYPTO"] = "Crypto";
    AssetType["FOREX"] = "Forex";
    AssetType["INDICES"] = "Indices";
    AssetType["COMMODITIES"] = "Commodities";
    AssetType["FUTURES"] = "Futures";
    AssetType["OPTIONS"] = "Options";
})(AssetType || (exports.AssetType = AssetType = {}));
var TradeDirection;
(function (TradeDirection) {
    TradeDirection["LONG"] = "Long";
    TradeDirection["SHORT"] = "Short";
})(TradeDirection || (exports.TradeDirection = TradeDirection = {}));
var TradeStatus;
(function (TradeStatus) {
    TradeStatus["OPEN"] = "Open";
    TradeStatus["CLOSED"] = "Closed";
    TradeStatus["PENDING"] = "Pending";
    TradeStatus["CANCELLED"] = "Cancelled";
})(TradeStatus || (exports.TradeStatus = TradeStatus = {}));
var TradingSession;
(function (TradingSession) {
    TradingSession["LONDON"] = "London";
    TradingSession["NEW_YORK"] = "New York";
    TradingSession["ASIA"] = "Asia";
    TradingSession["LONDON_NY_OVERLAP"] = "London-NY Overlap";
    TradingSession["OTHER"] = "Other";
})(TradingSession || (exports.TradingSession = TradingSession = {}));
var ICTConcept;
(function (ICTConcept) {
    ICTConcept["FVG"] = "Fair Value Gap";
    ICTConcept["ORDER_BLOCK"] = "Order Block";
    ICTConcept["BREAKER_BLOCK"] = "Breaker Block";
    ICTConcept["MITIGATION_BLOCK"] = "Mitigation Block";
    ICTConcept["LIQUIDITY_GRAB"] = "Liquidity Grab (BSL/SSL)";
    ICTConcept["LIQUIDITY_VOID"] = "Liquidity Void";
    ICTConcept["SILVER_BULLET"] = "Silver Bullet";
    ICTConcept["JUDAS_SWING"] = "Judas Swing";
    ICTConcept["SMT_DIVERGENCE"] = "SMT Divergence";
    ICTConcept["POWER_OF_THREE"] = "Power of Three (AMD)";
    ICTConcept["OPTIMAL_TRADE_ENTRY"] = "Optimal Trade Entry (OTE)";
    ICTConcept["MARKET_STRUCTURE_SHIFT"] = "Market Structure Shift (MSS)";
    ICTConcept["OTHER"] = "Other";
})(ICTConcept || (exports.ICTConcept = ICTConcept = {}));
var MarketMovementType;
(function (MarketMovementType) {
    MarketMovementType["EXPANSION"] = "Expansion";
    MarketMovementType["RETRACEMENT"] = "Retracement";
    MarketMovementType["REVERSAL"] = "Reversal";
    MarketMovementType["CONSOLIDATION"] = "Consolidation";
    MarketMovementType["OTHER"] = "Other";
})(MarketMovementType || (exports.MarketMovementType = MarketMovementType = {}));
var MarketSentiment;
(function (MarketSentiment) {
    MarketSentiment["BULLISH"] = "Bullish";
    MarketSentiment["BEARISH"] = "Bearish";
    MarketSentiment["NEUTRAL"] = "Neutral";
})(MarketSentiment || (exports.MarketSentiment = MarketSentiment = {}));
//# sourceMappingURL=enums.js.map