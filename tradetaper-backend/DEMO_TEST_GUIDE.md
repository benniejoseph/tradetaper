# Demo Account Testing Guide

## 🎯 Objective
Test the complete MT5 integration with a real demo account to verify that users can:
1. Enter their MT5 credentials
2. See their account information
3. View their trades and positions
4. Access historical data

## 📋 Demo Account Credentials
```
Server: MetaQuotes-Demo
Login: 5036821030
Password: Kr!c7zBb
Investor: U*DmS5Rt
```

## 🚀 Testing Steps

### Step 1: Test MetaApi Connection
```bash
# In tradetaper-backend directory
node test-metaapi-connection.js
```
**Expected**: ✅ Connection successful, API token working

### Step 2: Start Backend Server
```bash
npm run start:dev
```
**Expected**: Server running on http://localhost:3000

### Step 3: Test Health Endpoint
```bash
curl http://localhost:3000/api/mt5-accounts/health
```
**Expected**: `{"status":"healthy","message":"MetaApi service is operational"}`

### Step 4: Get Available Servers
```bash
curl http://localhost:3000/api/mt5-accounts/servers
```
**Expected**: List of available MT5 servers

### Step 5: Add Demo Account via API
```bash
curl -X POST http://localhost:3000/api/mt5-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "Demo Test Account",
    "server": "MetaQuotes-Demo",
    "login": "5036821030",
    "password": "Kr!c7zBb",
    "isRealAccount": false
  }'
```
**Expected**: Account created with ID and MetaApi account ID

### Step 6: Check Account Status
```bash
# Replace {accountId} with the ID from step 5
curl http://localhost:3000/api/mt5-accounts/{accountId}/status
```
**Expected**: Deployment state progressing (DEPLOYING → DEPLOYED)

### Step 7: Connect Account
```bash
# Wait for deployment to complete, then connect
curl -X POST http://localhost:3000/api/mt5-accounts/{accountId}/connect
```
**Expected**: Connection initiated successfully

### Step 8: Get Live Account Data
```bash
# Wait 30 seconds for connection, then get live data
curl http://localhost:3000/api/mt5-accounts/{accountId}/live-data
```
**Expected**: Account info, positions, orders, recent deals

### Step 9: Get Historical Data
```bash
# Get last 7 days of trade history
curl "http://localhost:3000/api/mt5-accounts/{accountId}/historical-trades?limit=10"
```
**Expected**: Historical trades (might be empty for new demo account)

### Step 10: Test Frontend Form
1. Navigate to your frontend application
2. Use the AddMT5AccountForm component
3. Fill in the demo credentials:
   - **Account Name**: Demo Test Account
   - **Server**: MetaQuotes-Demo  
   - **Login**: 5036821030
   - **Password**: Kr!c7zBb
4. Submit the form
5. Verify account appears in dashboard
6. Check live trading dashboard shows data

## 🔍 What Each Step Tests

| Step | Tests | Success Criteria |
|------|-------|------------------|
| 1 | MetaApi token validity | Connection to MetaApi cloud |
| 2-3 | Backend API health | Server responds correctly |
| 4 | Server enumeration | MT5 servers available |
| 5 | Account creation | MetaApi account created & deployment started |
| 6 | Deployment monitoring | Account deploys successfully |
| 7 | MT5 connection | Connection to actual MT5 server |
| 8 | Live data retrieval | Real-time account info accessible |
| 9 | Historical data | Past trades can be retrieved |
| 10 | Frontend integration | UI works end-to-end |

## 🎉 Success Indicators

After completing all steps, you should see:

### ✅ Account Information
```json
{
  "balance": 10000.00,
  "equity": 10000.00,
  "currency": "USD",
  "leverage": 100,
  "company": "MetaQuotes Ltd.",
  "server": "MetaQuotes-Demo"
}
```

### ✅ Live Data Available
- Real-time positions (if any open trades)
- Pending orders (if any set)
- Recent deals/transactions
- Account balance updates

### ✅ Frontend Working
- Form accepts credentials
- Account appears in list
- Live dashboard shows data
- Real-time updates working

## 🔧 Troubleshooting

### Issue: Deployment Timeout
**Solution**: Demo accounts can take 2-5 minutes to deploy. Wait longer.

### Issue: Connection Failed
**Solution**: Check credentials, ensure demo account is still active.

### Issue: No Historical Data
**Solution**: New demo accounts may have no trade history. This is normal.

### Issue: API Errors
**Solution**: Check MetaApi token permissions and quota limits.

## 🎯 Next Steps After Testing

1. **Scale Planning**: Decide on multi-account strategy for production
2. **User Onboarding**: Create user-friendly broker server selection
3. **Error Handling**: Improve error messages for common issues
4. **Real Account Testing**: Test with live account (small amount)
5. **Production Deployment**: Deploy with production MetaApi environment

## 💡 Pro Tips

- Keep demo credentials secure (even though they're demos)
- Test with different brokers if available
- Monitor MetaApi usage and quotas
- Set up proper logging for production
- Consider rate limiting for API endpoints

---

**🎉 If all steps pass, your MT5 integration is fully functional!**

Users can now add their real MT5 accounts using the same process. 