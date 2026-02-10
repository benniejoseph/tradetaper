# CSRF Protection Implementation

## Overview

CSRF (Cross-Site Request Forgery) protection has been implemented to secure state-changing operations (POST, PUT, PATCH, DELETE) against cross-site attacks.

## How It Works

1. **Token Generation**: A CSRF token is automatically generated and stored in an HTTP-only cookie (`__Host-csrf`)
2. **Token Validation**: All state-changing requests (POST, PUT, PATCH, DELETE) must include the CSRF token in the request headers
3. **Safe Methods**: GET, HEAD, and OPTIONS requests are exempt from CSRF validation

## Configuration

### Environment Variables

```bash
# Enable CSRF protection (automatically enabled in production)
ENABLE_CSRF=true

# CSRF secret (change in production!)
CSRF_SECRET=your-secure-random-secret-here
```

### Production

CSRF is **automatically enabled** in production (`NODE_ENV=production`).

### Development

CSRF is **disabled by default** in development for easier testing. Enable it manually with:
```bash
ENABLE_CSRF=true
```

## Frontend Integration

### Step 1: Get CSRF Token

Before making state-changing requests, get the CSRF token:

```typescript
// Get CSRF token
const response = await fetch('https://api.tradetaper.com/api/v1/csrf-token');
const { csrfToken } = await response.json();

// Store token (in memory, session storage, or context)
sessionStorage.setItem('csrfToken', csrfToken);
```

### Step 2: Include Token in Requests

Include the token in the `X-CSRF-Token` header for all POST/PUT/PATCH/DELETE requests:

```typescript
// Example: Create a trade
const csrfToken = sessionStorage.getItem('csrfToken');

const response = await fetch('https://api.tradetaper.com/api/v1/trades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Include CSRF token
    'Authorization': `Bearer ${accessToken}`,
  },
  credentials: 'include', // Include cookies
  body: JSON.stringify(tradeData),
});
```

### Step 3: Handle Token Expiration

If you receive a 403 Forbidden error with "Invalid CSRF token", refresh the token:

```typescript
async function makeAuthenticatedRequest(url, options) {
  let csrfToken = sessionStorage.getItem('csrfToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    },
  });

  // If CSRF token is invalid, refresh and retry
  if (response.status === 403) {
    const error = await response.json();
    if (error.message?.includes('CSRF')) {
      // Refresh token
      const tokenResponse = await fetch('/api/v1/csrf-token');
      const { csrfToken: newToken } = await tokenResponse.json();
      sessionStorage.setItem('csrfToken', newToken);

      // Retry request with new token
      return makeAuthenticatedRequest(url, options);
    }
  }

  return response;
}
```

### Axios Integration

If using Axios, configure it to automatically include the CSRF token:

```typescript
import axios from 'axios';

// Get CSRF token on app initialization
async function initializeCsrf() {
  const { data } = await axios.get('/api/v1/csrf-token');
  axios.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;
}

// Add interceptor to handle token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 403 &&
        error.response?.data?.message?.includes('CSRF')) {
      // Refresh token
      const { data } = await axios.get('/api/v1/csrf-token');
      axios.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;

      // Retry original request
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Initialize on app start
initializeCsrf();
```

## Exempted Endpoints

The following request types are **exempt** from CSRF validation:

- **GET** requests (read-only operations)
- **HEAD** requests (metadata retrieval)
- **OPTIONS** requests (CORS preflight)
- **WebSocket** upgrade requests

## Security Considerations

1. **HTTPS Required**: In production, CSRF cookies use the `Secure` flag, requiring HTTPS
2. **SameSite Strict**: Cookies use `SameSite=strict` to prevent cross-site cookie sending
3. **HTTP-Only**: CSRF cookies are HTTP-only to prevent JavaScript access
4. **Token Rotation**: Tokens are rotated periodically for enhanced security

## Testing

### With CSRF Enabled

```bash
# Test successful request
curl -X POST https://api.tradetaper.com/api/v1/trades \
  -H "X-CSRF-Token: your-token-here" \
  -H "Content-Type: application/json" \
  -H "Cookie: __Host-csrf=cookie-value" \
  -d '{"symbol":"EURUSD"}'

# Test rejected request (no token)
curl -X POST https://api.tradetaper.com/api/v1/trades \
  -H "Content-Type: application/json" \
  -d '{"symbol":"EURUSD"}'
# Expected: 403 Forbidden - Invalid CSRF token
```

### With CSRF Disabled (Development)

```bash
# Requests work without token
curl -X POST http://localhost:3000/api/v1/trades \
  -H "Content-Type: application/json" \
  -d '{"symbol":"EURUSD"}'
```

## Troubleshooting

### 403 Forbidden - Invalid CSRF Token

**Cause**: Missing or invalid CSRF token in request

**Solutions**:
1. Ensure you've fetched the CSRF token from `/api/v1/csrf-token`
2. Include token in `X-CSRF-Token` header
3. Include credentials (`credentials: 'include'`) to send cookies
4. Token may have expired - refresh it

### CSRF Protection Not Working

**Check**:
1. `ENABLE_CSRF=true` in environment variables
2. `NODE_ENV=production` (auto-enables)
3. Cookies are being sent with requests
4. HTTPS is used in production

### Token Not Generated

**Check**:
1. Cookie parser middleware is enabled
2. CSRF middleware is loaded in main.ts
3. `/api/v1/csrf-token` endpoint is accessible

## Implementation Details

- **Library**: `csrf-csrf` (modern, maintained alternative to deprecated `csurf`)
- **Algorithm**: Double Submit Cookie pattern
- **Token Storage**: HTTP-only cookie + request header validation
- **Token Size**: 64 bytes (512 bits)
- **Cookie Name**: `__Host-csrf` (secure prefix for enhanced protection)

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [csrf-csrf Documentation](https://github.com/Psifi-Solutions/csrf-csrf)
