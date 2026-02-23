"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timeframe = exports.HTFBias = exports.MarketCondition = exports.ExecutionGrade = exports.EmotionalState = exports.MarketSentiment = exports.MarketMovementType = exports.ICTConcept = exports.TradingSession = exports.TradeStatus = exports.TradeDirection = exports.AssetType = void 0;
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
var EmotionalState;
(function (EmotionalState) {
    EmotionalState["CALM"] = "Calm";
    EmotionalState["CONFIDENT"] = "Confident";
    EmotionalState["ANXIOUS"] = "Anxious";
    EmotionalState["FEARFUL"] = "Fearful";
    EmotionalState["GREEDY"] = "Greedy";
    EmotionalState["FRUSTRATED"] = "Frustrated";
    EmotionalState["OVERCONFIDENT"] = "Overconfident";
    EmotionalState["IMPATIENT"] = "Impatient";
    EmotionalState["FOMO"] = "FOMO";
    EmotionalState["REVENGE"] = "Revenge Trading";
    EmotionalState["BORED"] = "Bored";
    EmotionalState["FATIGUED"] = "Fatigued";
    EmotionalState["EXCITED"] = "Excited";
    EmotionalState["NERVOUS"] = "Nervous";
    EmotionalState["HOPEFUL"] = "Hopeful";
    EmotionalState["DISAPPOINTED"] = "Disappointed";
    EmotionalState["RELIEVED"] = "Relieved";
    EmotionalState["OVERWHELMED"] = "Overwhelmed";
    EmotionalState["HESITANT"] = "Hesitant";
    EmotionalState["RUSHED"] = "Rushed";
    EmotionalState["DISTRACTED"] = "Distracted";
    EmotionalState["FOCUSED"] = "Focused";
})(EmotionalState || (exports.EmotionalState = EmotionalState = {}));
var ExecutionGrade;
(function (ExecutionGrade) {
    ExecutionGrade["A"] = "A";
    ExecutionGrade["B"] = "B";
    ExecutionGrade["C"] = "C";
    ExecutionGrade["D"] = "D";
    ExecutionGrade["F"] = "F";
})(ExecutionGrade || (exports.ExecutionGrade = ExecutionGrade = {}));
var MarketCondition;
(function (MarketCondition) {
    MarketCondition["TRENDING_UP"] = "Trending Up";
    MarketCondition["TRENDING_DOWN"] = "Trending Down";
    MarketCondition["RANGING"] = "Ranging";
    MarketCondition["CHOPPY"] = "Choppy";
    MarketCondition["HIGH_VOLATILITY"] = "High Volatility";
    MarketCondition["LOW_VOLATILITY"] = "Low Volatility";
    MarketCondition["NEWS_DRIVEN"] = "News Driven";
    MarketCondition["PRE_NEWS"] = "Pre-News";
})(MarketCondition || (exports.MarketCondition = MarketCondition = {}));
var HTFBias;
(function (HTFBias) {
    HTFBias["BULLISH"] = "Bullish";
    HTFBias["BEARISH"] = "Bearish";
    HTFBias["NEUTRAL"] = "Neutral";
})(HTFBias || (exports.HTFBias = HTFBias = {}));
var Timeframe;
(function (Timeframe) {
    Timeframe["M1"] = "1m";
    Timeframe["M5"] = "5m";
    Timeframe["M15"] = "15m";
    Timeframe["M30"] = "30m";
    Timeframe["H1"] = "1H";
    Timeframe["H4"] = "4H";
    Timeframe["D1"] = "1D";
    Timeframe["W1"] = "1W";
    Timeframe["MN"] = "1M";
})(Timeframe || (exports.Timeframe = Timeframe = {}));
//# sourceMappingURL=enums.js.map