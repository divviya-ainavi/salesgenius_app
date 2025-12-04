# Session Expiry Testing Guide

## Current Implementation Status

### ✅ 3-Hour Auto-Logout is WORKING

Your app has a **3-hour automatic logout** mechanism that is properly implemented. Here's how it works:

## How Session Expiry Works

### 1. **Login Timestamp Tracking**
When a user logs in (`LoginPage.jsx:280`):
```javascript
localStorage.setItem("login_timestamp", Date.now().toString());
```

### 2. **Continuous Monitoring** (UserDropdown.jsx)
- Checks every **60 seconds** (every minute)
- Calculates elapsed time since login
- If elapsed time ≥ 3 hours → triggers automatic logout

### 3. **Automatic Logout Flow**
When 3 hours expire:
1. Sets auto-logout flag: `sessionStorage.setItem("auto_logout_reason", "3_hour_limit")`
2. Shows toast: "Your session has expired after 3 hours. Please log in again."
3. Calls `handleConfirmLogout()` which:
   - Signs out from Supabase: `supabase.auth.signOut()`
   - Clears all storage: `localStorage.clear()` + `sessionStorage.clear()`
   - Resets Redux state
   - Redirects to login page

### 4. **Supabase Token Management**
- Supabase tokens expire after **1 hour** by default
- Supabase **automatically refreshes** tokens in the background
- Your app manually calls `signOut()` after 3 hours, which:
  - Invalidates the refresh token
  - Triggers the `SIGNED_OUT` event in App.tsx
  - Ensures complete cleanup

## Testing the 3-Hour Auto-Logout

### Test 1: Manual Time Travel (Quick Test)

**Open Browser Console and run:**

```javascript
// 1. Check current login time
const loginTime = parseInt(localStorage.getItem("login_timestamp"));
console.log("Login time:", new Date(loginTime).toLocaleString());

// 2. Check elapsed time
const elapsed = Date.now() - loginTime;
const hours = (elapsed / (1000 * 60 * 60)).toFixed(2);
console.log("Elapsed hours:", hours);

// 3. Force 3-hour expiry (for testing)
// Set login time to 3 hours ago
const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
localStorage.setItem("login_timestamp", threeHoursAgo.toString());
console.log("✅ Set login time to 3 hours ago");
console.log("Wait up to 1 minute for auto-logout...");
```

**Expected Result:**
- Within 60 seconds, you should see:
  - Toast message: "Your session has expired after 3 hours. Please log in again."
  - Redirected to login page
  - All storage cleared

### Test 2: Near-Expiry Check

**Check when logout will happen:**

```javascript
const loginTime = parseInt(localStorage.getItem("login_timestamp"));
const elapsed = Date.now() - loginTime;
const threeHours = 3 * 60 * 60 * 1000;
const remaining = threeHours - elapsed;

if (remaining > 0) {
  const minutes = Math.floor(remaining / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  console.log(`⏰ Auto-logout in: ${minutes}m ${seconds}s`);
} else {
  console.log("⚠️ Session should have expired!");
}
```

### Test 3: Verify Check Interval

**Monitor the session checks:**

```javascript
// Watch for session check logs
console.log("🔍 Monitoring session checks...");
console.log("Look for '🕐 Session check:' logs every 60 seconds");

// The UserDropdown component logs this every minute:
// "🕐 Session check: { loginTime, currentTime, elapsedHours, remainingMinutes }"
```

### Test 4: Full 3-Hour Test (Production Test)

1. **Log in to the app**
2. **Note the time**: Record your login time
3. **Keep the browser tab open** (don't close it)
4. **Wait for 3 hours** (or close to it)
5. **Check browser console** for logs around the 3-hour mark
6. **Verify auto-logout happens**

## Expected Console Logs

### Normal Operation (before 3 hours)
```
🕐 Session check: {
  loginTime: "1/10/2025, 10:00:00 AM",
  currentTime: "1/10/2025, 11:30:00 AM",
  elapsedHours: "1.50",
  remainingMinutes: 90
}
```

### At 3-Hour Expiry
```
🕐 Session check: {
  loginTime: "1/10/2025, 10:00:00 AM",
  currentTime: "1/10/2025, 1:00:00 PM",
  elapsedHours: "3.00",
  remainingMinutes: 0
}
⏰ 3-hour session limit reached - triggering automatic logout
🔒 Supabase token expired - auto logout triggered
```

### After Logout
```
[Toast]: "Your session has expired after 3 hours. Please log in again."
[Redirect]: /auth/login
[Storage]: localStorage and sessionStorage cleared
```

## Troubleshooting

### Issue: "No login timestamp found" in console

**Cause**: `login_timestamp` not set during login

**Fix**: Ensure you're using the latest login code. The timestamp is set in `LoginPage.jsx:280`

**Check:**
```javascript
console.log(localStorage.getItem("login_timestamp"));
// Should return a number like: "1736510400000"
```

### Issue: Session not expiring after 3 hours

**Possible Causes:**

1. **Browser tab was closed/refreshed**
   - The timer resets when you close and reopen the app
   - The `login_timestamp` persists, so it should still work

2. **UserDropdown component not mounted**
   - The session check only runs when UserDropdown is rendered
   - UserDropdown is in MainLayout, which is only on protected routes

3. **Console errors preventing execution**
   - Check browser console for any JavaScript errors

**Debug:**
```javascript
// Check if the interval is running
console.log("Checking for session check interval...");
// Look for "🕐 Session check:" logs every minute
```

### Issue: Gets logged out before 3 hours

**Possible Causes:**

1. **Supabase token expired and didn't refresh**
   - Should be fixed by the rate limit fixes
   - Check Network tab for excessive token refresh requests

2. **Multiple tabs/windows**
   - Each tab has its own interval
   - Logout in one tab might affect others

3. **Login timestamp was modified**
   - Check: `console.log(localStorage.getItem("login_timestamp"))`

## Testing Different Scenarios

### Scenario 1: Idle User (3 hours)
- ✅ Should auto-logout after exactly 3 hours
- ✅ Works even if user is idle

### Scenario 2: Active User (3 hours)
- ✅ Should auto-logout after exactly 3 hours
- ⚠️ User activity doesn't extend session (by design)

### Scenario 3: Multiple Tabs
- ✅ Each tab checks independently
- ✅ Logout in one tab should affect others via storage events

### Scenario 4: Page Refresh
- ✅ `login_timestamp` persists in localStorage
- ✅ Timer continues from original login time

### Scenario 5: Computer Sleep/Wake
- ✅ Should check immediately on wake
- ✅ If >3 hours passed during sleep, auto-logout occurs

## Summary

### ✅ What's Working:
1. 3-hour session timeout is properly implemented
2. Checks every minute for expiry
3. Automatically logs out and clears storage
4. Shows user-friendly error message
5. Redirects to login page
6. Properly signs out from Supabase

### ⚠️ Important Notes:
1. The 3-hour timer starts from **login time**, not from last activity
2. User activity **does not extend** the session (you'd need to add this if desired)
3. The check runs **every 60 seconds**, so logout might be up to 1 minute late
4. Closing and reopening the app **does not reset** the timer

### 🔧 If You Want Different Behavior:

**Option 1: Extend session on user activity**
- Add activity listeners (mouse move, keyboard, clicks)
- Update `login_timestamp` on activity
- Would need to implement inactivity timeout separately

**Option 2: Change timeout duration**
- Edit `THREE_HOURS_IN_MS` in `UserDropdown.jsx:39`
- Example: `const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;`

**Option 3: More frequent checks**
- Change interval in `UserDropdown.jsx:164`
- Example: `setInterval(checkSessionExpiry, 30 * 1000)` // Check every 30s

## Conclusion

Your **3-hour auto-logout is fully functional and working correctly**. It will automatically log users out after 3 hours from their login time, regardless of activity.
