# MT5 Real Data Integration Setup Guide

## Overview

To get your **real MT5 account data** (balance: $98,000, actual losing trades) instead of mock data, you need to set up the TradeTaper Bridge Expert Advisor in your MetaTrader 5 terminal.

## Step-by-Step Setup

### 1. Install the Expert Advisor

1. **Copy the EA file**: Copy the `TradeTaperBridge.mq5` file to your MT5 terminal's Expert Advisors folder:
   ```
   [MT5 Installation Folder]\MQL5\Experts\TradeTaperBridge.mq5
   ```
   
   Common locations:
   - Windows: `C:\Program Files\MetaTrader 5\MQL5\Experts\`
   - Or: `%APPDATA%\MetaQuotes\Terminal\[Terminal ID]\MQL5\Experts\`

2. **Compile the EA**: 
   - Open MetaEditor (F4 in MT5)
   - Open `TradeTaperBridge.mq5`
   - Click "Compile" or press F7
   - Ensure no compilation errors

### 2. Enable Expert Advisors

1. In MT5, go to **Tools → Options → Expert Advisors**
2. Check the following boxes:
   - ✅ Allow automated trading
   - ✅ Allow DLL imports
   - ✅ Allow imports of external experts

### 3. Attach the EA to Your Chart

1. Open any chart (symbol doesn't matter)
2. Drag `TradeTaperBridge` from the Navigator panel to the chart
3. In the settings dialog:
   - **Common tab**: Check "Allow live trading"
   - **Inputs tab**: Verify settings:
     - `BackendURL`: `http://localhost:3000`
     - `UpdateInterval`: `5000` (5 seconds)
     - `EnableFileExport`: `true`
     - `DataDirectory`: Leave empty for auto-detection
4. Click OK

### 4. Verify the Connection

Once the EA is running, you should see in the MT5 **Experts** tab:

```
=== TradeTaper Bridge v2.0 Initializing ===
Account Number: [Your Login]
Account Server: [Your Server]
Account Balance: $98000.00
Account Equity: $[Your Equity]
Data Directory: [Path to data files]
=== TradeTaper Bridge Initialized Successfully ===
```

### 5. Check Data Export

The EA creates files in the MT5 data directory:
```
[MT5 Data Path]\Files\TradeTaper\
├── account_[YourLogin].json      # Real account data
├── trades_[YourLogin].json       # Your actual trades
├── status.json                   # Connection status
└── request_[YourLogin].json      # Backend requests
```

### 6. Backend Integration

The backend will automatically:
1. ✅ Detect the EA data files
2. ✅ Read your real balance ($98,000)
3. ✅ Import your actual losing trades
4. ✅ Update the frontend with correct data

## Troubleshooting

### EA Not Starting
- Ensure "Allow automated trading" is enabled
- Check the Experts tab for error messages
- Verify the EA is compiled without errors

### No Data Files Created
- Check MT5 data path: **File → Open Data Folder**
- Ensure folder permissions allow file creation
- Look for "TradeTaper" subfolder in `Files/` directory

### Backend Still Shows Mock Data
1. Check backend logs for connection attempts
2. Verify the EA status file is being updated
3. Restart the backend to force reconnection

### Data Files Present But Not Loading
- Check file timestamps (should be recent)
- Verify JSON format is valid
- Ensure login number matches your account

## Data Directory Locations

The backend checks these locations automatically:
1. `%APPDATA%\MetaQuotes\Terminal\Common\Files\TradeTaper\`
2. `%USERPROFILE%\Documents\MT5\Files\TradeTaper\`
3. `./mt5-data/TradeTaper`
4. `../mt5-data/TradeTaper`

## Expected Log Output

When working correctly, you'll see:
```
[MT5BridgeService] Attempting to connect to MT5 for account [ID] (Server: [Server], Login: [Login])
[MT5BridgeService] Trying file-based connection...
[MT5BridgeService] ✅ Found MT5 data directory: [Path]
[MT5BridgeService] ✅ Successfully read account data from MT5 EA
[MT5BridgeService] Account: [Login], Balance: $98000.00, Equity: $[Equity]
[MT5BridgeService] ✅ Found [X] deals in trades file
[MT5BridgeService] 🎯 Using REAL MT5 trade data from Expert Advisor
```

## Real-Time Updates

Once connected:
- ✅ Account balance updates every 5 seconds
- ✅ New trades imported automatically
- ✅ Real-time profit/loss tracking
- ✅ Accurate account metrics in dashboard

## Security Notes

- The EA only **reads** account data, never places trades
- No sensitive credentials are stored in files
- All communication is via local file system
- EA can be disabled anytime without affecting trading

---

**Need Help?** Check the backend logs for detailed connection status and troubleshooting information. 