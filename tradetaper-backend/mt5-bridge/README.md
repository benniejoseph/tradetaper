# TradeTaper MT5 Bridge Setup Guide

This guide explains how to set up the MetaTrader 5 bridge to connect your MT5 terminal with the TradeTaper application.

## Overview

The TradeTaper MT5 Bridge enables real-time synchronization between your MetaTrader 5 trading terminal and the TradeTaper web application. It supports multiple connection methods:

1. **File-based communication** (Recommended for most users)
2. **WebSocket connection** (For advanced users with custom setups)
3. **TCP connection** (For DLL-based integrations)
4. **Mock mode** (For development and testing)

## Installation Methods

### Method 1: Expert Advisor Installation (Recommended)

1. **Download the Expert Advisor**
   - Copy the `TradeTaperBridge.mq5` file to your MT5 `Experts` folder
   - Default location: `C:\Users\[Username]\AppData\Roaming\MetaQuotes\Terminal\[Terminal ID]\MQL5\Experts\`

2. **Compile the Expert Advisor**
   - Open MetaEditor in MT5
   - Open the `TradeTaperBridge.mq5` file
   - Press F7 or click "Compile" to compile the EA
   - Ensure there are no compilation errors

3. **Attach to Chart**
   - In MT5, drag the `TradeTaperBridge` EA onto any chart
   - Configure the input parameters:
     - **WebSocketURL**: Leave as default unless you have a custom WebSocket server
     - **UpdateInterval**: How often to sync data (5 seconds recommended)
     - **EnableLogging**: Enable for troubleshooting
     - **DataPath**: Leave empty for auto-detection

4. **Enable Expert Advisors**
   - Make sure "Expert Advisors" button is enabled in MT5 toolbar
   - Check that "Allow DLL imports" is enabled in Tools → Options → Expert Advisors

### Method 2: Manual File Setup

If you prefer not to use an Expert Advisor, you can set up file-based communication manually:

1. **Create Data Directory**
   ```
   C:\Users\[Username]\AppData\Roaming\MetaQuotes\Terminal\[Terminal ID]\MQL5\Files\TradeTaper\
   ```

2. **Configure TradeTaper Backend**
   - Set the `MT5_DATA_PATH` environment variable to point to the directory above
   - Ensure `MT5_MOCK_MODE=true` in your environment variables for testing

## Configuration

### Environment Variables

Add these to your TradeTaper backend `.env` file:

```env
# MT5 Bridge Configuration
MT5_WEBSOCKET_URL=ws://localhost:8765
MT5_TCP_HOST=localhost
MT5_TCP_PORT=9090
MT5_DATA_PATH=C:\Users\[Username]\AppData\Roaming\MetaQuotes\Terminal\[Terminal ID]\MQL5\Files\TradeTaper\
MT5_MOCK_MODE=true
```

### MT5 Terminal Settings

1. **Enable Expert Advisors**
   - Tools → Options → Expert Advisors
   - Check "Allow automated trading"
   - Check "Allow DLL imports"
   - Check "Allow WebRequest for listed URL" and add your TradeTaper domain

2. **File Access Permissions**
   - Ensure MT5 has read/write access to the data directory
   - Run MT5 as administrator if needed

## Usage

### Adding MT5 Accounts in TradeTaper

1. **Navigate to Settings**
   - Go to Settings → Accounts in TradeTaper
   - Click "Add MT5 Account"

2. **Enter Account Details**
   - **Account Name**: A friendly name for your account
   - **Server**: Your MT5 broker server (e.g., "ICMarketsSC-Demo")
   - **Login**: Your MT5 account number
   - **Password**: Your MT5 account password
   - **Active**: Enable to start syncing

3. **Test Connection**
   - Click "Sync Account" to test the connection
   - Check the MT5 terminal logs for connection status

### Syncing Data

- **Manual Sync**: Click the sync button next to any account
- **Automatic Sync**: The bridge will automatically sync every 5 seconds (configurable)
- **Import Trades**: Use the "Import Trades" feature to pull historical trading data

## Connection Methods Explained

### 1. File-Based Communication (Default)

- **How it works**: TradeTaper writes request files, MT5 EA reads them and writes response files
- **Pros**: Simple, reliable, works with all MT5 installations
- **Cons**: Slightly slower than real-time methods
- **Best for**: Most users, especially beginners

### 2. WebSocket Connection

- **How it works**: Direct WebSocket connection between TradeTaper and MT5
- **Pros**: Real-time, fast, bidirectional communication
- **Cons**: Requires additional WebSocket server setup
- **Best for**: Advanced users with custom requirements

### 3. TCP Connection

- **How it works**: TCP socket connection for DLL-based integrations
- **Pros**: Fast, reliable for custom DLL solutions
- **Cons**: Requires DLL development knowledge
- **Best for**: Developers creating custom integrations

### 4. Mock Mode

- **How it works**: Generates fake data for testing
- **Pros**: Works without MT5, good for development
- **Cons**: Not real data
- **Best for**: Development, testing, demos

## Troubleshooting

### Common Issues

1. **"No MT5 connection" Error**
   - Check that the Expert Advisor is running
   - Verify the data path is correct
   - Ensure MT5 has file access permissions

2. **Authentication Failed**
   - Double-check your MT5 login credentials
   - Ensure the server name is correct
   - Check that your account allows API access

3. **Data Not Syncing**
   - Check MT5 Expert tab for error messages
   - Verify the update interval setting
   - Ensure TradeTaper backend is running

4. **File Permission Errors**
   - Run MT5 as administrator
   - Check Windows file permissions on the data directory
   - Disable antivirus temporarily to test

### Debug Steps

1. **Enable Logging**
   - Set `EnableLogging=true` in the EA parameters
   - Check MT5 Expert tab for detailed logs

2. **Check File System**
   - Verify files are being created in the data directory
   - Check file timestamps to ensure they're recent

3. **Test Mock Mode**
   - Set `MT5_MOCK_MODE=true` to test without MT5
   - This helps isolate MT5-specific issues

### Log Locations

- **MT5 Logs**: MT5 Terminal → Expert tab
- **TradeTaper Logs**: Backend console or log files
- **File System**: Check the data directory for request/response files

## Security Considerations

1. **Credential Storage**
   - MT5 passwords are encrypted in the TradeTaper database
   - Use demo accounts for testing when possible

2. **File Permissions**
   - Ensure the data directory is not accessible to other users
   - Consider using a dedicated MT5 installation for TradeTaper

3. **Network Security**
   - WebSocket connections should use secure protocols in production
   - Consider firewall rules for TCP connections

## Advanced Configuration

### Custom WebSocket Server

If you want to implement a custom WebSocket server:

```javascript
// Example Node.js WebSocket server
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8765 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    // Handle MT5 requests
    console.log('Received:', data);
  });
});
```

### Custom Data Path

You can specify a custom data path in the EA parameters or environment variables:

```env
MT5_DATA_PATH=/custom/path/to/mt5/data
```

## Support

If you encounter issues:

1. Check this README for common solutions
2. Enable debug logging and check the logs
3. Test with mock mode to isolate issues
4. Contact TradeTaper support with log files

## Version History

- **v1.0**: Initial release with file-based communication
- **v1.1**: Added WebSocket and TCP support (planned)
- **v1.2**: Enhanced error handling and logging (planned)

## License

This MT5 bridge is part of the TradeTaper application and is subject to the same license terms. 