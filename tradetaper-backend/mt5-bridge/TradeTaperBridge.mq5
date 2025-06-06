//+------------------------------------------------------------------+
//|                                           TradeTaperBridge.mq5 |
//|                                  Copyright 2024, TradeTaper    |
//|                                   https://tradetaper.com       |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, TradeTaper"
#property link      "https://tradetaper.com"
#property version   "1.00"
#property description "TradeTaper Bridge - Connects MT5 to TradeTaper application"

//--- Input parameters
input string WebSocketURL = "ws://localhost:8765";  // WebSocket server URL
input int    UpdateInterval = 5;                    // Update interval in seconds
input bool   EnableLogging = true;                  // Enable detailed logging
input string DataPath = "";                         // Data exchange folder path (leave empty for auto)

//--- Global variables
int websocket_handle = INVALID_HANDLE;
datetime last_update = 0;
string data_folder = "";
bool is_connected = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("TradeTaper Bridge EA starting...");
    
    // Set up data folder
    if(StringLen(DataPath) > 0)
        data_folder = DataPath;
    else
        data_folder = TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL5\\Files\\TradeTaper\\";
    
    // Create data folder if it doesn't exist
    if(!FolderCreate(data_folder, 0))
    {
        if(GetLastError() != 5019) // Folder already exists
        {
            Print("Failed to create data folder: ", data_folder);
            return INIT_FAILED;
        }
    }
    
    Print("Data folder: ", data_folder);
    
    // Try to establish WebSocket connection
    ConnectWebSocket();
    
    // Set timer for periodic updates
    EventSetTimer(UpdateInterval);
    
    Print("TradeTaper Bridge EA initialized successfully");
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    EventKillTimer();
    
    if(websocket_handle != INVALID_HANDLE)
    {
        SocketClose(websocket_handle);
        websocket_handle = INVALID_HANDLE;
    }
    
    Print("TradeTaper Bridge EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
    // Check WebSocket connection
    if(!is_connected)
    {
        ConnectWebSocket();
    }
    
    // Process file-based requests
    ProcessFileRequests();
    
    // Send periodic account update
    if(TimeCurrent() - last_update >= UpdateInterval)
    {
        SendAccountUpdate();
        last_update = TimeCurrent();
    }
}

//+------------------------------------------------------------------+
//| Connect to WebSocket server                                      |
//+------------------------------------------------------------------+
void ConnectWebSocket()
{
    if(websocket_handle != INVALID_HANDLE)
        return;
        
    // Note: MT5 doesn't have built-in WebSocket support
    // This is a placeholder for when WebSocket libraries become available
    // For now, we'll use file-based communication
    
    if(EnableLogging)
        Print("WebSocket connection not available, using file-based communication");
}

//+------------------------------------------------------------------+
//| Process file-based requests                                      |
//+------------------------------------------------------------------+
void ProcessFileRequests()
{
    string files[];
    int file_count = 0;
    
    // Look for request files
    string search_pattern = data_folder + "request_*.json";
    
    // Note: MT5 doesn't have a direct way to list files
    // We'll check for common request file patterns
    for(int i = 0; i < 100; i++)
    {
        string filename = data_folder + "request_" + IntegerToString(i) + ".json";
        if(FileIsExist(filename))
        {
            ProcessRequest(filename);
        }
    }
}

//+------------------------------------------------------------------+
//| Process individual request file                                  |
//+------------------------------------------------------------------+
void ProcessRequest(string filename)
{
    int file_handle = FileOpen(filename, FILE_READ | FILE_TXT);
    if(file_handle == INVALID_HANDLE)
        return;
        
    string request_data = "";
    while(!FileIsEnding(file_handle))
    {
        request_data += FileReadString(file_handle);
    }
    FileClose(file_handle);
    
    if(EnableLogging)
        Print("Processing request: ", request_data);
    
    // Parse request (simplified JSON parsing)
    string account_id = ExtractJsonValue(request_data, "accountId");
    string action = ExtractJsonValue(request_data, "action");
    
    if(action == "authenticate")
    {
        ProcessAuthRequest(account_id, filename);
    }
    else if(action == "getAccountInfo")
    {
        ProcessAccountInfoRequest(account_id, filename);
    }
    else if(action == "getHistory")
    {
        ProcessHistoryRequest(account_id, filename, request_data);
    }
    
    // Delete processed request file
    FileDelete(filename);
}

//+------------------------------------------------------------------+
//| Process authentication request                                   |
//+------------------------------------------------------------------+
void ProcessAuthRequest(string account_id, string request_file)
{
    // Create response file
    string response_file = StringReplace(request_file, "request_", "response_");
    
    MqlTradeRequest request;
    MqlTradeResult result;
    
    // Get account info
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double equity = AccountInfoDouble(ACCOUNT_EQUITY);
    double margin = AccountInfoDouble(ACCOUNT_MARGIN);
    double margin_free = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
    double profit = AccountInfoDouble(ACCOUNT_PROFIT);
    int leverage = (int)AccountInfoInteger(ACCOUNT_LEVERAGE);
    string currency = AccountInfoString(ACCOUNT_CURRENCY);
    
    // Create response JSON
    string response = "{\n";
    response += "  \"success\": true,\n";
    response += "  \"accountInfo\": {\n";
    response += "    \"balance\": " + DoubleToString(balance, 2) + ",\n";
    response += "    \"equity\": " + DoubleToString(equity, 2) + ",\n";
    response += "    \"margin\": " + DoubleToString(margin, 2) + ",\n";
    response += "    \"marginFree\": " + DoubleToString(margin_free, 2) + ",\n";
    response += "    \"profit\": " + DoubleToString(profit, 2) + ",\n";
    response += "    \"leverage\": " + IntegerToString(leverage) + ",\n";
    response += "    \"currency\": \"" + currency + "\"\n";
    response += "  }\n";
    response += "}";
    
    // Write response file
    int file_handle = FileOpen(response_file, FILE_WRITE | FILE_TXT);
    if(file_handle != INVALID_HANDLE)
    {
        FileWriteString(file_handle, response);
        FileClose(file_handle);
        
        if(EnableLogging)
            Print("Authentication response sent for account: ", account_id);
    }
}

//+------------------------------------------------------------------+
//| Process account info request                                     |
//+------------------------------------------------------------------+
void ProcessAccountInfoRequest(string account_id, string request_file)
{
    ProcessAuthRequest(account_id, request_file); // Same as auth for now
}

//+------------------------------------------------------------------+
//| Process history request                                          |
//+------------------------------------------------------------------+
void ProcessHistoryRequest(string account_id, string request_file, string request_data)
{
    string response_file = StringReplace(request_file, "request_", "response_");
    
    // Extract date range from request
    string from_date_str = ExtractJsonValue(request_data, "fromDate");
    string to_date_str = ExtractJsonValue(request_data, "toDate");
    
    datetime from_date = (datetime)StringToInteger(from_date_str) / 1000;
    datetime to_date = (datetime)StringToInteger(to_date_str) / 1000;
    
    // Get trading history
    if(!HistorySelect(from_date, to_date))
    {
        Print("Failed to select history for period: ", TimeToString(from_date), " to ", TimeToString(to_date));
        return;
    }
    
    int total_deals = HistoryDealsTotal();
    string response = "{\n";
    response += "  \"success\": true,\n";
    response += "  \"deals\": [\n";
    
    for(int i = 0; i < total_deals && i < 100; i++) // Limit to 100 deals
    {
        ulong deal_ticket = HistoryDealGetTicket(i);
        if(deal_ticket > 0)
        {
            double volume = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
            double price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
            double commission = HistoryDealGetDouble(deal_ticket, DEAL_COMMISSION);
            double swap = HistoryDealGetDouble(deal_ticket, DEAL_SWAP);
            double profit = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
            datetime time = (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);
            string symbol = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);
            ENUM_DEAL_TYPE deal_type = (ENUM_DEAL_TYPE)HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
            string comment = HistoryDealGetString(deal_ticket, DEAL_COMMENT);
            
            if(i > 0) response += ",\n";
            response += "    {\n";
            response += "      \"ticket\": " + IntegerToString(deal_ticket) + ",\n";
            response += "      \"time\": " + IntegerToString(time) + ",\n";
            response += "      \"symbol\": \"" + symbol + "\",\n";
            response += "      \"type\": " + IntegerToString(deal_type) + ",\n";
            response += "      \"volume\": " + DoubleToString(volume, 2) + ",\n";
            response += "      \"price\": " + DoubleToString(price, 5) + ",\n";
            response += "      \"commission\": " + DoubleToString(commission, 2) + ",\n";
            response += "      \"swap\": " + DoubleToString(swap, 2) + ",\n";
            response += "      \"profit\": " + DoubleToString(profit, 2) + ",\n";
            response += "      \"comment\": \"" + comment + "\"\n";
            response += "    }";
        }
    }
    
    response += "\n  ]\n";
    response += "}";
    
    // Write response file
    int file_handle = FileOpen(response_file, FILE_WRITE | FILE_TXT);
    if(file_handle != INVALID_HANDLE)
    {
        FileWriteString(file_handle, response);
        FileClose(file_handle);
        
        if(EnableLogging)
            Print("History response sent for account: ", account_id, " (", total_deals, " deals)");
    }
}

//+------------------------------------------------------------------+
//| Send periodic account update                                     |
//+------------------------------------------------------------------+
void SendAccountUpdate()
{
    if(!is_connected)
        return;
        
    // This would send real-time updates via WebSocket when available
    // For now, we'll create a status file
    
    string status_file = data_folder + "account_status.json";
    
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double equity = AccountInfoDouble(ACCOUNT_EQUITY);
    double margin = AccountInfoDouble(ACCOUNT_MARGIN);
    double profit = AccountInfoDouble(ACCOUNT_PROFIT);
    
    string status = "{\n";
    status += "  \"timestamp\": " + IntegerToString(TimeCurrent()) + ",\n";
    status += "  \"balance\": " + DoubleToString(balance, 2) + ",\n";
    status += "  \"equity\": " + DoubleToString(equity, 2) + ",\n";
    status += "  \"margin\": " + DoubleToString(margin, 2) + ",\n";
    status += "  \"profit\": " + DoubleToString(profit, 2) + "\n";
    status += "}";
    
    int file_handle = FileOpen(status_file, FILE_WRITE | FILE_TXT);
    if(file_handle != INVALID_HANDLE)
    {
        FileWriteString(file_handle, status);
        FileClose(file_handle);
    }
}

//+------------------------------------------------------------------+
//| Extract value from JSON string (simplified)                     |
//+------------------------------------------------------------------+
string ExtractJsonValue(string json, string key)
{
    string search_key = "\"" + key + "\"";
    int start_pos = StringFind(json, search_key);
    if(start_pos == -1)
        return "";
        
    start_pos = StringFind(json, ":", start_pos);
    if(start_pos == -1)
        return "";
        
    start_pos++;
    
    // Skip whitespace and quotes
    while(start_pos < StringLen(json) && 
          (StringGetCharacter(json, start_pos) == ' ' || 
           StringGetCharacter(json, start_pos) == '\t' ||
           StringGetCharacter(json, start_pos) == '\n' ||
           StringGetCharacter(json, start_pos) == '"'))
    {
        start_pos++;
    }
    
    int end_pos = start_pos;
    bool in_quotes = false;
    
    // Find end of value
    while(end_pos < StringLen(json))
    {
        ushort char_code = StringGetCharacter(json, end_pos);
        if(char_code == '"')
            in_quotes = !in_quotes;
        else if(!in_quotes && (char_code == ',' || char_code == '}' || char_code == '\n'))
            break;
        end_pos++;
    }
    
    string value = StringSubstr(json, start_pos, end_pos - start_pos);
    
    // Remove trailing quotes and whitespace
    value = StringTrimRight(value);
    value = StringTrimLeft(value);
    if(StringLen(value) > 0 && StringGetCharacter(value, StringLen(value) - 1) == '"')
        value = StringSubstr(value, 0, StringLen(value) - 1);
    if(StringLen(value) > 0 && StringGetCharacter(value, 0) == '"')
        value = StringSubstr(value, 1);
        
    return value;
}

//+------------------------------------------------------------------+
//| Trade transaction function                                       |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                       const MqlTradeRequest& request,
                       const MqlTradeResult& result)
{
    // Send trade notifications when available
    if(EnableLogging)
    {
        Print("Trade transaction: ", EnumToString(trans.type), 
              " Symbol: ", trans.symbol,
              " Volume: ", trans.volume,
              " Price: ", trans.price);
    }
}

//+------------------------------------------------------------------+
//| Tick function                                                    |
//+------------------------------------------------------------------+
void OnTick()
{
    // Handle real-time price updates if needed
    // This can be used to send live price feeds to TradeTaper
} 