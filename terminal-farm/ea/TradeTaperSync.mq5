//+------------------------------------------------------------------+
//|                                              TradeTaperSync.mq5 |
//|                                      Copyright 2024, TradeTaper |
//|                                       https://www.tradetaper.io |
//+------------------------------------------------------------------+
#property copyright "TradeTaper"
#property link      "https://www.tradetaper.io"
#property version   "1.10"
#property strict

//--- Input parameters
input string   APIEndpoint       = "https://api.tradetaper.com";  // TradeTaper API URL
input string   APIKey            = "";                             // API Key (provided by TradeTaper)
input string   TerminalId        = "";                             // Terminal ID (auto-generated)
input string   AuthToken         = "";                             // Per-terminal JWT (preferred)
input int      HeartbeatInterval = 30;                             // Heartbeat interval (seconds)
input int      SyncInterval      = 60;                             // Trade sync interval (seconds)
input int      PositionInterval  = 15;                             // Live position push interval (seconds) [FIX #1]
input int      MaxDealsPerBatch  = 100;                            // Max deals per HTTP batch [FIX #12]
input int      HttpTimeout       = 8000;                           // HTTP request timeout (ms)
input int      MaxRetries        = 2;                              // HTTP retry count on failure [FIX #6]

//--- Global variables
datetime lastHeartbeat    = 0;
datetime lastSync         = 0;
datetime lastPositionSync = 0;  // [FIX #1] Separate position sync timer
bool     isInitialized    = false;

// GlobalVariable names for persistence across restarts [FIX #10]
string GV_LAST_DEAL_COUNT = "TT_LastDealCount_" + TerminalId;
string GV_LAST_SYNC_TIME  = "TT_LastSyncTime_"  + TerminalId;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
    if(StringLen(TerminalId) == 0)
    {
        Print("Error: TerminalId is required");
        return(INIT_FAILED);
    }

    Print("TradeTaper Sync EA v1.10 initialized");
    Print("Terminal ID: ", TerminalId);
    Print("API Endpoint: ", APIEndpoint);

    // Set timer for periodic tasks
    EventSetTimer(10);

    // Do initial sync
    WriteLog("OnInit: Initializing...");
    SendHeartbeat();
    SyncDealHistoryIncremental(); // [FIX #2] Use incremental history
    SyncPositions();

    isInitialized = true;
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    EventKillTimer();
    Print("TradeTaper Sync EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Timer function                                                    |
//+------------------------------------------------------------------+
void OnTimer()
{
    datetime now = TimeCurrent();

    // Heartbeat
    if(now - lastHeartbeat >= HeartbeatInterval)
    {
        SendHeartbeat();
        lastHeartbeat = now;
    }

    // [FIX #1] Periodic position push — independent of trade events
    if(now - lastPositionSync >= PositionInterval)
    {
        SyncPositions();
        lastPositionSync = now;
    }

    // Periodic full deal history sync
    if(now - lastSync >= SyncInterval)
    {
        SyncDealHistoryIncremental(); // [FIX #2]
        lastSync = now;
    }
}

//+------------------------------------------------------------------+
//| Trade event function — fires on position creation/modification   |
//+------------------------------------------------------------------+
void OnTrade()
{
    // Immediate sync when a trade event occurs
    SyncPositions();
    SyncDealHistoryIncremental(); // [FIX #2] Still use incremental here
}

//+------------------------------------------------------------------+
//| Helper: Escape JSON strings                                       |
//+------------------------------------------------------------------+
string EscapeJSON(string text)
{
    string output = text;
    StringReplace(output, "\\", "\\\\");
    StringReplace(output, "\"", "\\\"");
    StringReplace(output, "\n", " ");
    StringReplace(output, "\r", "");
    StringReplace(output, "\t", " ");
    return output;
}

//+------------------------------------------------------------------+
//| Helper: Write debug log                                           |
//+------------------------------------------------------------------+
void WriteLog(string message)
{
    int handle = FileOpen("TradeTaperSync.log", FILE_WRITE|FILE_TXT|FILE_READ|FILE_SHARE_READ|FILE_SHARE_WRITE);
    if(handle != INVALID_HANDLE)
    {
        FileSeek(handle, 0, SEEK_END);
        FileWrite(handle, TimeToString(TimeCurrent()) + " " + message);
        FileClose(handle);
    }
}

//+------------------------------------------------------------------+
//| [FIX #6] Send HTTP POST with retry/backoff                        |
//+------------------------------------------------------------------+
string SendRequestWithRetry(string url, string jsonData, int maxRetries = 2)
{
    for(int attempt = 0; attempt <= maxRetries; attempt++)
    {
        string result = SendRequest(url, jsonData);

        // Success check
        if(StringFind(result, "\"success\"") >= 0 || StringFind(result, "success") >= 0)
        {
            if(attempt > 0)
                WriteLog("Request succeeded after " + IntegerToString(attempt) + " retries for " + url);
            return result;
        }

        // Check if it's a terminal error (4xx) — not worth retrying
        if(StringFind(result, "Error: 4") >= 0 || StringFind(result, "\"error\"") >= 0)
        {
            WriteLog("Terminal error (no retry): " + result);
            return result;
        }

        if(attempt < maxRetries)
        {
            int sleepMs = 1000 * (attempt + 1); // 1s, 2s backoff
            WriteLog("Request failed (attempt " + IntegerToString(attempt + 1) + "), retrying in " + IntegerToString(sleepMs/1000) + "s...");
            Sleep(sleepMs);
        }
    }
    return "Error: Max retries exceeded";
}

//+------------------------------------------------------------------+
//| Send HTTP POST request (base, single attempt)                    |
//+------------------------------------------------------------------+
string SendRequest(string url, string jsonData)
{
    char postData[];
    char resultData[];
    string resultHeaders;
    string headers = "Content-Type: application/json\r\n";

    if(StringLen(APIKey) > 0)
        headers += "X-Api-Key: " + APIKey + "\r\n";

    StringToCharArray(jsonData, postData, 0, StringLen(jsonData));

    int response = WebRequest(
        "POST",
        url,
        headers,
        HttpTimeout,
        postData,
        resultData,
        resultHeaders
    );

    if(response == -1)
    {
        int errorCode = GetLastError();
        return "Error: " + IntegerToString(errorCode);
    }

    return CharArrayToString(resultData);
}

//+------------------------------------------------------------------+
//| [FIX #4] Robust command parsing — flat delimited response        |
//| Server returns: {"success":true,"command":"CMD","payload":"..."}  |
//| Parsing is kept flat — no nested JSON values needed               |
//+------------------------------------------------------------------+
string ParseCommand(string json)
{
    // Look for "command":"VALUE"
    string searchKey = "\"command\":\"";
    int start = StringFind(json, searchKey);
    if(start == -1) return "";
    start += StringLen(searchKey);
    int end = StringFind(json, "\"", start);
    if(end == -1) return "";
    return StringSubstr(json, start, end - start);
}

string ParsePayload(string json)
{
    // Look for "payload":"VALUE" — payload values are always simple strings
    string searchKey = "\"payload\":\"";
    int start = StringFind(json, searchKey);
    if(start == -1) return "";
    start += StringLen(searchKey);
    // Walk to find closing quote, handle escaped quotes
    int end = start;
    while(end < StringLen(json))
    {
        string ch = StringSubstr(json, end, 1);
        if(ch == "\\" ) { end += 2; continue; } // skip escaped char
        if(ch == "\"") break;
        end++;
    }
    return StringSubstr(json, start, end - start);
}

//+------------------------------------------------------------------+
//| Fetch candle data for a symbol and time range                    |
//+------------------------------------------------------------------+
void FetchCandles(string symbol, string timeframeStr, string startStr, string endStr, string tradeId)
{
    ENUM_TIMEFRAMES period = PERIOD_H1;
    if(timeframeStr == "1m")  period = PERIOD_M1;
    else if(timeframeStr == "5m")  period = PERIOD_M5;
    else if(timeframeStr == "15m") period = PERIOD_M15;
    else if(timeframeStr == "30m") period = PERIOD_M30;
    else if(timeframeStr == "1h")  period = PERIOD_H1;
    else if(timeframeStr == "4h")  period = PERIOD_H4;
    else if(timeframeStr == "1d")  period = PERIOD_D1;

    if(!SymbolSelect(symbol, true))
    {
        WriteLog("SymbolSelect failed for " + symbol + ". Error=" + IntegerToString(GetLastError()));
        return;
    }

    datetime start = 0;
    datetime end   = 0;
    bool startIsNumeric = (StringLen(startStr) >= 8 && StringFind(startStr, ".") == -1 && StringFind(startStr, "-") == -1 && StringFind(startStr, ":") == -1);
    bool endIsNumeric   = (StringLen(endStr)   >= 8 && StringFind(endStr,   ".") == -1 && StringFind(endStr,   "-") == -1 && StringFind(endStr,   ":") == -1);

    if(startIsNumeric && endIsNumeric)
    {
        start = (datetime)StringToInteger(startStr);
        end   = (datetime)StringToInteger(endStr);
    }
    else
    {
        string normalizedStart = startStr;
        string normalizedEnd   = endStr;
        StringReplace(normalizedStart, "T", " ");
        StringReplace(normalizedEnd,   "T", " ");
        StringReplace(normalizedStart, "-", ".");
        StringReplace(normalizedEnd,   "-", ".");
        start = StringToTime(normalizedStart);
        end   = StringToTime(normalizedEnd);
    }

    if(start == 0 || end == 0)
    {
        WriteLog("Invalid candle time range. start=" + startStr + " end=" + endStr);
        return;
    }
    if(end < start) { datetime tmp = start; start = end; end = tmp; }

    MqlRates rates[];
    ArraySetAsSeries(rates, true);
    ResetLastError();
    MqlTick tick;
    int copied = CopyRates(symbol, period, start, end, rates);
    if(copied <= 0)
    {
        int err = GetLastError();
        WriteLog("CopyRates initial failed for " + symbol + " (" + IntegerToString(err) + "). Retrying...");
        for(int attempt = 0; attempt < 10; attempt++)
        {
            if(SeriesInfoInteger(symbol, period, SERIES_SYNCHRONIZED)) break;
            SymbolInfoTick(symbol, tick);
            Sleep(500);
        }
        ResetLastError();
        copied = CopyRates(symbol, period, start, end, rates);
    }

    if(copied > 0)
    {
        string json = "{";
        json += "\"terminalId\":\"" + TerminalId + "\",";
        if(StringLen(AuthToken) > 0)
            json += "\"authToken\":\"" + AuthToken + "\",";
        json += "\"tradeId\":\"" + tradeId + "\",";
        json += "\"symbol\":\"" + symbol + "\",";
        json += "\"candles\":[";

        for(int i = copied - 1; i >= 0; i--)
        {
            json += "{";
            json += "\"time\":"  + IntegerToString(rates[i].time)                  + ",";
            json += "\"open\":"  + DoubleToString(rates[i].open,  _Digits)         + ",";
            json += "\"high\":"  + DoubleToString(rates[i].high,  _Digits)         + ",";
            json += "\"low\":"   + DoubleToString(rates[i].low,   _Digits)         + ",";
            json += "\"close\":" + DoubleToString(rates[i].close, _Digits);
            json += "}";
            if(i > 0) json += ",";
        }
        json += "]}";

        string url = APIEndpoint + "/api/v1/webhook/terminal/candles";
        SendRequestWithRetry(url, json, 1); // [FIX #6] 1 retry for candles
        WriteLog("Sent " + IntegerToString(copied) + " candles for " + symbol);
    }
    else
    {
        WriteLog("Failed to CopyRates for " + symbol + ". Error=" + IntegerToString(GetLastError()));
    }
}

//+------------------------------------------------------------------+
//| Send heartbeat to TradeTaper API                                  |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
    string url = APIEndpoint + "/api/v1/webhook/terminal/heartbeat";

    string json = "{";
    json += "\"terminalId\":\"" + TerminalId + "\",";
    if(StringLen(AuthToken) > 0)
        json += "\"authToken\":\"" + AuthToken + "\",";
    json += "\"accountInfo\":{";
    json += "\"balance\":"    + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE),     2) + ",";
    json += "\"equity\":"     + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY),      2) + ",";
    json += "\"margin\":"     + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN),      2) + ",";
    json += "\"freeMargin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2) + ",";
    json += "\"floatingPnl\":" + DoubleToString(AccountInfoDouble(ACCOUNT_PROFIT),    2); // [Enhancement #16]
    json += "}}";

    string result = SendRequestWithRetry(url, json, MaxRetries); // [FIX #6]
    WriteLog("Heartbeat response: " + result);

    if(StringFind(result, "success") >= 0)
    {
        Print("Heartbeat OK");

        // [FIX #4] Use robust parsing
        string command = ParseCommand(result);
        if(command == "") { WriteLog("No command in heartbeat response"); return; }

        if(command == "FETCH_CANDLES")
        {
            string payload = ParsePayload(result);
            WriteLog("Received Command: FETCH_CANDLES. Args: " + payload);

            string args[];
            int count = StringSplit(payload, ',', args);
            if(count == 5)
                FetchCandles(args[0], args[1], args[2], args[3], args[4]);
            else
                WriteLog("Error: Invalid FETCH_CANDLES args count: " + IntegerToString(count));
        }
        else if(command == "SYNC_TRADES")
        {
            WriteLog("Received Command: SYNC_TRADES. Forcing full re-sync...");
            SyncDealHistoryIncremental();
        }
    }
    else
    {
        Print("Heartbeat failed: ", result);
        WriteLog("Error: Heartbeat failed. Result: " + result);
    }
}

//+------------------------------------------------------------------+
//| [FIX #2 + #10 + #12] Incremental deal history sync               |
//| - Uses last sync time as fromDate instead of epoch               |
//| - Persists lastDealCount across restarts via GlobalVariableSet   |
//| - Chunks uploads at MaxDealsPerBatch per request                  |
//+------------------------------------------------------------------+
void SyncDealHistoryIncremental()
{
    // [FIX #10] Restore state from GlobalVariables (persist across EA restarts)
    int  restoredDealCount = (int)GlobalVariableGet(GV_LAST_DEAL_COUNT);
    long restoredSyncTime  = (long)GlobalVariableGet(GV_LAST_SYNC_TIME);

    // [FIX #2] Only fetch from last sync time, not from epoch
    // Use 1-day lookback on first run to catch any recent trades
    datetime fromDate = (restoredSyncTime > 0)
        ? (datetime)(restoredSyncTime - 86400)   // 1-day overlap for safety
        : (datetime)(TimeCurrent() - 90 * 86400); // 90-day lookback on fresh install
    datetime toDate = TimeCurrent();

    if(!HistorySelect(fromDate, toDate))
    {
        Print("Failed to select history");
        WriteLog("Error: Failed to select history");
        return;
    }

    int totalDeals = HistoryDealsTotal();
    WriteLog("SyncCheck (incremental): Total Deals in range=" + IntegerToString(totalDeals) + ", LastCount=" + IntegerToString(restoredDealCount));

    // [FIX #10] Compare against globally persisted count
    if(totalDeals == restoredDealCount && restoredSyncTime > 0)
    {
        WriteLog("No new deals since last sync.");
        return;
    }

    Print("Syncing ", totalDeals, " deals from ", TimeToString(fromDate), "...");

    // [FIX #12] Chunked batch upload
    string allDeals[];
    ArrayResize(allDeals, 0);
    int dealArraySize = 0;

    for(int i = 0; i < totalDeals; i++)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket == 0) continue;

        ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
        ENUM_DEAL_TYPE  type  = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);

        // Only process buy/sell deals
        if(type != DEAL_TYPE_BUY && type != DEAL_TYPE_SELL) continue;

        string symbol       = HistoryDealGetString(ticket, DEAL_SYMBOL);
        double volume       = HistoryDealGetDouble(ticket, DEAL_VOLUME);
        double price        = HistoryDealGetDouble(ticket, DEAL_PRICE);
        double commission   = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
        double swap         = HistoryDealGetDouble(ticket, DEAL_SWAP);
        double profit       = HistoryDealGetDouble(ticket, DEAL_PROFIT);
        datetime time       = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
        string comment      = HistoryDealGetString(ticket, DEAL_COMMENT);
        long positionId     = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
        long magic          = HistoryDealGetInteger(ticket, DEAL_MAGIC);
        long reason         = HistoryDealGetInteger(ticket, DEAL_REASON);
        double sl           = HistoryDealGetDouble(ticket, DEAL_SL);
        double tp           = HistoryDealGetDouble(ticket, DEAL_TP);
        double contractSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);

        string dealJson = "{";
        dealJson += "\"ticket\":\"" + IntegerToString(ticket) + "\",";
        dealJson += "\"symbol\":\"" + symbol + "\",";
        dealJson += "\"type\":\""   + (type == DEAL_TYPE_BUY ? "BUY" : "SELL") + "\",";
        dealJson += "\"volume\":"   + DoubleToString(volume, 2)       + ",";
        dealJson += "\"openPrice\":" + DoubleToString(price, 5)       + ",";
        dealJson += "\"commission\":" + DoubleToString(commission, 2) + ",";
        dealJson += "\"swap\":"      + DoubleToString(swap, 2)        + ",";
        dealJson += "\"profit\":"    + DoubleToString(profit, 2)      + ",";
        dealJson += "\"openTime\":\"" + IntegerToString((long)time)   + "\",";
        dealJson += "\"comment\":\""  + EscapeJSON(comment)           + "\",";
        dealJson += "\"positionId\":" + IntegerToString(positionId)   + ",";
        dealJson += "\"magic\":"      + IntegerToString(magic)        + ",";
        dealJson += "\"entryType\":"  + IntegerToString((long)entry)  + ",";
        dealJson += "\"reason\":"     + IntegerToString(reason)       + ",";
        dealJson += "\"stopLoss\":"   + DoubleToString(sl, 5)         + ",";
        dealJson += "\"takeProfit\":" + DoubleToString(tp, 5)         + ",";
        dealJson += "\"contractSize\":" + DoubleToString(contractSize, 2);
        dealJson += "}";

        ArrayResize(allDeals, dealArraySize + 1);
        allDeals[dealArraySize] = dealJson;
        dealArraySize++;
    }

    // Send in chunks of MaxDealsPerBatch [FIX #12]
    int totalSent   = 0;
    bool allSuccess = true;

    for(int batchStart = 0; batchStart < dealArraySize; batchStart += MaxDealsPerBatch)
    {
        int batchEnd = MathMin(batchStart + MaxDealsPerBatch, dealArraySize);
        string tradesJson = "[";
        for(int j = batchStart; j < batchEnd; j++)
        {
            if(j > batchStart) tradesJson += ",";
            tradesJson += allDeals[j];
        }
        tradesJson += "]";

        string json = "{";
        json += "\"terminalId\":\"" + TerminalId + "\",";
        if(StringLen(AuthToken) > 0)
            json += "\"authToken\":\"" + AuthToken + "\",";
        json += "\"batchIndex\":" + IntegerToString(batchStart / MaxDealsPerBatch) + ",";
        json += "\"trades\":" + tradesJson;
        json += "}";

        string url    = APIEndpoint + "/api/v1/webhook/terminal/trades";
        string result = SendRequestWithRetry(url, json, MaxRetries); // [FIX #6]

        if(StringFind(result, "success") >= 0)
        {
            totalSent += (batchEnd - batchStart);
            WriteLog("Batch " + IntegerToString(batchStart/MaxDealsPerBatch + 1) + " sent: " + IntegerToString(batchEnd - batchStart) + " deals.");
        }
        else
        {
            WriteLog("Batch upload failed: " + result);
            allSuccess = false;
        }
    }

    if(allSuccess)
    {
        Print("Trade sync completed: ", totalSent, " deals sent.");
        WriteLog("Success: Trade sync completed. Total=" + IntegerToString(totalSent));

        // [FIX #10] Persist state globally so it survives EA restart
        GlobalVariableSet(GV_LAST_DEAL_COUNT, totalDeals);
        GlobalVariableSet(GV_LAST_SYNC_TIME,  (double)TimeCurrent());
    }
    else
    {
        WriteLog("Partial sync failure — not updating persisted state.");
    }
}

//+------------------------------------------------------------------+
//| [FIX #18 Enhancement] Sync open positions (includes comment)     |
//+------------------------------------------------------------------+
void SyncPositions()
{
    int totalPositions = PositionsTotal();

    string positionsJson = "[";
    bool firstPosition = true;

    for(int i = 0; i < totalPositions; i++)
    {
        ulong ticket = PositionGetTicket(i);
        if(ticket == 0) continue;

        string symbol        = PositionGetString(POSITION_SYMBOL);
        ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
        double volume        = PositionGetDouble(POSITION_VOLUME);
        double openPrice     = PositionGetDouble(POSITION_PRICE_OPEN);
        double currentPrice  = PositionGetDouble(POSITION_PRICE_CURRENT);
        double profit        = PositionGetDouble(POSITION_PROFIT);
        double sl            = PositionGetDouble(POSITION_SL);
        double tp            = PositionGetDouble(POSITION_TP);
        datetime openTime    = (datetime)PositionGetInteger(POSITION_TIME);
        string comment       = PositionGetString(POSITION_COMMENT);    // [Enhancement #18]
        long magic           = PositionGetInteger(POSITION_MAGIC);
        double swap          = PositionGetDouble(POSITION_SWAP);

        if(!firstPosition) positionsJson += ",";
        firstPosition = false;

        positionsJson += "{";
        positionsJson += "\"ticket\":\""      + IntegerToString(ticket)             + "\",";
        positionsJson += "\"symbol\":\""      + symbol                              + "\",";
        positionsJson += "\"type\":\""        + (type == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\",";
        positionsJson += "\"volume\":"        + DoubleToString(volume,       2)     + ",";
        positionsJson += "\"openPrice\":"     + DoubleToString(openPrice,    5)     + ",";
        positionsJson += "\"currentPrice\":"  + DoubleToString(currentPrice, 5)     + ",";
        positionsJson += "\"profit\":"        + DoubleToString(profit,       2)     + ",";
        positionsJson += "\"swap\":"          + DoubleToString(swap,         2)     + ",";
        positionsJson += "\"openTime\":\""    + IntegerToString((long)openTime)     + "\",";
        positionsJson += "\"stopLoss\":"      + DoubleToString(sl, 5)               + ",";
        positionsJson += "\"takeProfit\":"    + DoubleToString(tp, 5)               + ",";
        positionsJson += "\"magic\":"         + IntegerToString(magic)              + ",";
        positionsJson += "\"comment\":\""     + EscapeJSON(comment)                 + "\""; // [Enhancement #18]
        positionsJson += "}";
    }

    positionsJson += "]";

    string json = "{";
    json += "\"terminalId\":\"" + TerminalId + "\",";
    if(StringLen(AuthToken) > 0)
        json += "\"authToken\":\"" + AuthToken + "\",";
    json += "\"positions\":" + positionsJson;
    json += "}";

    string url    = APIEndpoint + "/api/v1/webhook/terminal/positions";
    string result = SendRequestWithRetry(url, json, 1); // [FIX #6] 1 retry for positions

    if(StringFind(result, "success") >= 0)
        Print("Position sync OK: ", totalPositions, " positions");
    else
        WriteLog("Position sync failed: " + result);
}

//+------------------------------------------------------------------+
//| Calculate risk in account currency for a trade                   |
//+------------------------------------------------------------------+
double CalculateTradeRisk(string symbol, double lotSize, double entryPrice, double slPrice)
{
    if(slPrice == 0) return 0;
    double pointValue = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
    double pointSize  = SymbolInfoDouble(symbol, SYMBOL_POINT);
    if(pointValue == 0 || pointSize == 0) return 0;
    double pipDiff    = MathAbs(entryPrice - slPrice) / pointSize;
    return pipDiff * pointValue * lotSize;
}

//+------------------------------------------------------------------+
//| Calculate max lot size for given risk percentage                  |
//+------------------------------------------------------------------+
double CalculateMaxLotForRisk(string symbol, double riskPercent, double entryPrice, double slPrice)
{
    double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    double maxRiskAmount  = accountBalance * (riskPercent / 100.0);
    double pointValue     = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
    double pointSize      = SymbolInfoDouble(symbol, SYMBOL_POINT);
    if(pointValue == 0 || pointSize == 0 || slPrice == 0) return 0.01;
    double pipDiff = MathAbs(entryPrice - slPrice) / pointSize;
    if(pipDiff == 0) return 0.01;
    double maxLot     = maxRiskAmount / (pipDiff * pointValue);
    double lotStep    = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
    double minLot     = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
    double maxLotSym  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
    maxLot = MathFloor(maxLot / lotStep) * lotStep;
    maxLot = MathMax(minLot, MathMin(maxLot, maxLotSym));
    return maxLot;
}
//+------------------------------------------------------------------+
