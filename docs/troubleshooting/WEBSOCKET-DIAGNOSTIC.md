# WebSocket Connection Diagnostic

## Run These Commands in Browser Console (F12)

### 1. Check if you're logged in
```javascript
console.log('Cookies:', document.cookie);
console.log('Has auth_token:', document.cookie.includes('auth_token'));
```

### 2. Check Redux auth state
```javascript
// If Redux DevTools is installed:
const state = window.__REDUX_DEVTOOLS_EXTENSION__ ?
  JSON.parse(localStorage.getItem('persist:root') || '{}') : null;
console.log('Auth state:', state?.auth);
```

### 3. Check current chunk being loaded
```javascript
const scripts = Array.from(document.querySelectorAll('script[src]'));
const chunks = scripts
  .map(s => s.src)
  .filter(s => s.includes('.js'))
  .map(s => s.split('/').pop());
console.log('Loaded chunks:', chunks);
```

### 4. Check WebSocket connection attempts
```javascript
// Open Network tab → WS (WebSocket filter)
// Look for connection attempts and their status
```

### 5. Force hard refresh
```javascript
// Method 1: Clear all and reload
localStorage.clear();
sessionStorage.clear();
location.reload(true);

// Method 2: Service worker (if exists)
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.unregister()));
```

## Expected Results

**If Logged In:**
- Cookie should contain: `auth_token=<long-jwt-string>`
- Redux state should show: `isAuthenticated: true`

**If Fix Deployed:**
- Chunk names should be DIFFERENT from: `1612-2fc7ff25c7165bb2.js`
- WebSocket URL should include: `/notifications/`

**If Still Broken:**
- Old chunk: `1612-2fc7ff25c7165bb2.js` → Vercel not deployed yet
- No auth_token cookie → Not logged in
- Connection error → Backend rejecting

## Action Based on Results

### If NOT logged in:
1. Go to `/login`
2. Login with credentials
3. Check if WebSocket connects

### If Vercel NOT deployed:
1. Wait 2-3 more minutes
2. Check: https://vercel.com/benniejosephs-projects/tradetaper-frontend
3. Verify commit `db8b824` shows "Ready"
4. Hard refresh (Ctrl+Shift+R)

### If STILL broken after deployment:
1. Share console error screenshot
2. Share Network tab WebSocket attempt
3. We'll investigate backend logs
