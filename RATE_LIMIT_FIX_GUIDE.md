# Supabase Rate Limit Fix Guide

## Problem
You're experiencing `429 Too Many Requests` errors from Supabase's token refresh endpoint. This happens when there are too many token refresh requests in a short period.

## Root Causes Fixed
1. **Multiple Auth Listeners**: The app was creating multiple `onAuthStateChange` listeners on every component render
2. **No Refresh Control**: The Supabase client wasn't configured to optimize token refresh behavior
3. **Listener Duplication**: Each app re-render was setting up a new listener without properly cleaning up old ones

## Changes Made

### 1. Enhanced Supabase Client Configuration (`src/lib/supabase.js`)
```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'x-application-name': 'salesgenius-ai',
    },
  },
})
```

### 2. Singleton Auth Listener Manager (`src/lib/supabase.js`)
Created a singleton pattern to prevent multiple auth state listeners:
```javascript
export const setupAuthStateListener = (callback) => {
  // Prevents multiple listeners from being created
  // Only one listener will be active at a time
}
```

### 3. Updated App.tsx
Changed from direct `onAuthStateChange` to using the singleton listener manager.

## Immediate Steps to Resolve Rate Limit

### Step 1: Clear All Sessions (CRITICAL)
Run these in your browser console on the app:
```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Clear Supabase-specific storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase')) {
    localStorage.removeItem(key);
  }
});

// Reload the page
window.location.reload();
```

### Step 2: Wait for Rate Limit to Reset
- Supabase rate limits typically reset after **1 hour**
- During this time, **DO NOT** keep refreshing the page
- Close all browser tabs with your app open

### Step 3: Deploy the Fixed Code
1. Deploy the updated code with the fixes
2. Clear browser cache completely
3. Log in fresh

## Additional Recommendations

### 1. Monitor Token Refresh Behavior
Add this to your browser console to monitor refresh attempts:
```javascript
// Monitor Supabase network requests
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('supabase'))
  .forEach(r => console.log(r.name, r.startTime));
```

### 2. Check for Multiple Tab Issues
- Close all other tabs/windows with your app open
- Multiple tabs can multiply the refresh requests

### 3. Verify No Other Auth Listeners
Search your codebase for:
```bash
grep -r "onAuthStateChange" src/
```
Ensure all uses go through the singleton manager.

### 4. Check Network Tab
In Chrome DevTools:
1. Open Network tab
2. Filter for "token?grant_type=refresh_token"
3. Count how many requests happen in 1 minute
4. Should be at most 1-2 requests per minute

## Prevention Best Practices

### 1. Always Use getSession() Over getUser()
```javascript
// ✅ GOOD - Doesn't trigger refresh
const { data: { session } } = await supabase.auth.getSession();

// ❌ AVOID - May trigger refresh
const { data: { user } } = await supabase.auth.getUser();
```

### 2. Limit Auth State Listeners
- Only set up ONE listener at the app root level
- Never set up listeners in components that re-render frequently
- Always clean up listeners on unmount

### 3. Use React.useEffect Dependencies Correctly
```javascript
// ✅ GOOD - Runs once
useEffect(() => {
  // setup listener
}, []); // Empty array

// ❌ BAD - Runs on every render
useEffect(() => {
  // setup listener
}); // No dependency array
```

## Testing the Fix

### 1. After Deploying
1. Clear browser storage completely
2. Log in to the app
3. Open Chrome DevTools → Network tab
4. Filter for "supabase"
5. Keep the tab open for 5 minutes
6. Count token refresh requests - should be 0-1 max

### 2. Multiple Tab Test
1. Open the app in 3 different tabs
2. Monitor network requests
3. Should not see 3x the requests

### 3. Long Session Test
1. Keep app open for 1 hour
2. Should only see refresh when token is about to expire (< 60 seconds)
3. No constant refreshing

## Emergency: If Rate Limit Persists

### Option 1: Contact Supabase Support
If rate limit persists after 1 hour:
```
Subject: Rate Limit Reset Request
Body:
Project URL: [your-project-url]
Issue: Hit auth token refresh rate limit
Fixed: Multiple listeners causing excessive refreshes
Request: Rate limit reset to test fixes
```

### Option 2: Temporary Workaround
While waiting for rate limit reset:
1. Use Supabase Dashboard directly
2. Manage data through SQL Editor
3. Avoid using the app until rate limit resets

## Monitoring Going Forward

Add this monitoring code to track auth events:
```javascript
setupAuthStateListener((event, session) => {
  console.log(`Auth Event: ${event} at ${new Date().toISOString()}`);

  // Track in analytics
  analytics.track('auth_state_change', {
    event,
    timestamp: new Date().toISOString(),
  });

  // Your existing logic...
});
```

## Summary

The fix addresses the root cause by:
1. ✅ Preventing multiple auth listeners
2. ✅ Optimizing Supabase client configuration
3. ✅ Using singleton pattern for auth state management
4. ✅ Proper cleanup of listeners

After deploying these changes and waiting for the rate limit to reset, your app should work normally without hitting rate limits.
