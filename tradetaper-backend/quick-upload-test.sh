#!/bin/bash

echo "🚀 Quick Trade History Upload Test"
echo "=================================="

BASE_URL="http://localhost:3000/api/v1"

# Test credentials
EMAIL="test@example.com"
PASSWORD="testPassword123"

echo ""
echo "🔐 Step 1: Getting JWT token..."

# Login and extract token
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if [[ $? -ne 0 ]]; then
  echo "❌ Login request failed"
  exit 1
fi

# Extract token using grep and sed (works on most systems)
TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\(.*\)"/\1/')

if [[ -z "$TOKEN" ]]; then
  echo "❌ Failed to extract token from response:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Got authentication token"

echo ""
echo "📊 Step 2: Creating manual MT5 account..."

# Create manual account
ACCOUNT_RESPONSE=$(curl -s -X POST "$BASE_URL/mt5-accounts/manual" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "accountName": "Test Upload Account",
    "server": "Manual-Upload",
    "login": "123456789",
    "isRealAccount": false
  }')

# Extract account ID
ACCOUNT_ID=$(echo "$ACCOUNT_RESPONSE" | grep -o '"id":"[^"]*"' | sed 's/"id":"\(.*\)"/\1/')

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "⚠️ Manual account creation failed, trying existing accounts..."
  
  # Get existing accounts
  ACCOUNTS_RESPONSE=$(curl -s -X GET "$BASE_URL/mt5-accounts" \
    -H "Authorization: Bearer $TOKEN")
  
  ACCOUNT_ID=$(echo "$ACCOUNTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
  
  if [[ -z "$ACCOUNT_ID" ]]; then
    echo "❌ No accounts available for testing"
    exit 1
  fi
  
  echo "✅ Using existing account: $ACCOUNT_ID"
else
  echo "✅ Created manual account: $ACCOUNT_ID"
fi

echo ""
echo "📄 Step 3: Testing HTML file upload..."

# Test HTML file upload
if [[ -f "Files/5036821030_ Bennie Joe - Trade History Report.html" ]]; then
  echo "   📂 Uploading HTML file..."
  
  UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/mt5-accounts/$ACCOUNT_ID/upload-trade-history" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@Files/5036821030_ Bennie Joe - Trade History Report.html")
  
  echo "   📋 Upload Response:"
  echo "$UPLOAD_RESPONSE" | head -c 500
  echo ""
  
  # Check if upload was successful
  if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ HTML upload successful!"
    
    # Extract trade count
    TRADE_COUNT=$(echo "$UPLOAD_RESPONSE" | grep -o '"tradesImported":[0-9]*' | sed 's/"tradesImported":\(.*\)/\1/')
    echo "   📈 Trades imported: $TRADE_COUNT"
  else
    echo "   ❌ HTML upload failed"
  fi
else
  echo "   ⚠️ HTML test file not found"
fi

echo ""
echo "📊 Step 4: Testing Excel file upload..."

# Test Excel file upload
if [[ -f "Files/ReportHistory-5036821030.xlsx" ]]; then
  echo "   📂 Uploading Excel file..."
  
  UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/mt5-accounts/$ACCOUNT_ID/upload-trade-history" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@Files/ReportHistory-5036821030.xlsx")
  
  echo "   📋 Upload Response:"
  echo "$UPLOAD_RESPONSE" | head -c 500
  echo ""
  
  # Check if upload was successful
  if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Excel upload successful!"
    
    # Extract trade count
    TRADE_COUNT=$(echo "$UPLOAD_RESPONSE" | grep -o '"tradesImported":[0-9]*' | sed 's/"tradesImported":\(.*\)/\1/')
    echo "   📈 Trades imported: $TRADE_COUNT"
  else
    echo "   ❌ Excel upload failed"
  fi
else
  echo "   ⚠️ Excel test file not found"
fi

echo ""
echo "🎉 Upload testing completed!"
echo ""
echo "💡 Summary:"
echo "   • File upload provides an alternative to MetaApi integration"
echo "   • Users can manually sync trades by uploading MT5 reports"
echo "   • Supports both HTML and Excel formats"
echo "   • No real-time connection required" 