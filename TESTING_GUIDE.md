# Voice Rooms Testing Guide

## Quick Start Testing

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- User logged in with valid JWT token
- Browser DevTools console open for debugging

---

## Test 1: Create Voice Room ✅

**Steps:**
1. Navigate to `/dashboard/student/community/voice`
2. Click "+ Create Room" button
3. Enter room name: `"Test Room 1"`
4. Select type: `"STUDY"`
5. Click "Create Room"

**Expected Results:**
- ✅ Modal closes
- ✅ New room appears in the grid
- ✅ Success toast shows: "Voice room created"
- ✅ Console shows: `[API REQUEST] POST /voice/rooms`
- ✅ No errors in network tab

---

## Test 2: Fetch Rooms (Polling) ✅

**Steps:**
1. Wait 5 seconds after page load
2. Check Network tab (DevTools)
3. Check Console for logs

**Expected Results:**
- ✅ First `GET /voice/rooms` returns 200
- ✅ Polling `GET /voice/rooms` returns 200 (not 401)
- ✅ Console shows: `[API RESPONSE] GET /voice/rooms 200`
- ✅ Room list updates with current rooms
- ✅ No 401 errors in network tab

---

## Test 3: Join Voice Room ✅

**Steps:**
1. Click "Join Room" on any room card
2. Check Network tab and Console

**Expected Results:**
- ✅ Button changes to "Leave Room"
- ✅ Success toast shows: "Joined [Room Name]"
- ✅ Console shows:
  - `[API REQUEST] GET /voice/rooms/[roomName]/token`
  - `[API REQUEST] POST /voice/rooms/[roomId]/join`
- ✅ Both requests return 200
- ✅ Room participant count increases
- ✅ Active Speakers sidebar shows you're speaking

---

## Test 4: Polling While Joined ✅

**Steps:**
1. Join a room
2. Wait 5+ seconds (at least 2 polling intervals)
3. Check Network tab for polling requests

**Expected Results:**
- ✅ Multiple `GET /voice/rooms` requests return 200
- ✅ NO 401 errors
- ✅ Room list stays fresh with current data
- ✅ Participant count remains accurate
- ✅ You stay in the room (button still says "Leave Room")

---

## Test 5: Leave Voice Room ✅

**Steps:**
1. Click "Leave Room" button
2. Check Network tab and Console

**Expected Results:**
- ✅ Button changes back to "Join Room"
- ✅ Success toast shows: "Left the voice room"
- ✅ Console shows:
  - `[API REQUEST] POST /voice/rooms/[roomId]/leave`
- ✅ Request returns 200
- ✅ Room participant count decreases
- ✅ Active Speakers sidebar updates

---

## Test 6: Error Handling - Invalid Room ❌

**Steps:**
1. Open DevTools Network tab
2. Find a `GET /voice/rooms/[roomName]/token` request
3. Delete the room from database directly (simulate deletion)
4. Click "Join Room" on that room

**Expected Results:**
- ✅ Error toast shows: "Room not found" or "Failed to join room"
- ✅ Network shows 404 or 400 response
- ✅ Console shows: `[Join Room Error]`
- ✅ Button remains "Join Room"
- ✅ No silent failures

---

## Test 7: Auth Token Expiration ❌

**Steps:**
1. Join a room successfully
2. Wait for token to expire (or manually clear it)
3. Check Network tab for next polling request

**Expected Results:**
- ✅ When token expires:
  - Console shows: `[Auth Error] Token may have expired, will retry`
  - NO error toast (polling errors are silent)
  - Backend would return 401, but client handles gracefully
- ✅ User can refresh page and re-login
- ✅ After re-login, polling works again

---

## Test 8: Multiple Users ✅

**Steps:**
1. **User A**: Create room "Multi-User Test"
2. **User B**: Join the same room
3. Both check participant list and Active Speakers

**Expected Results:**
- ✅ Room shows 2 participants
- ✅ Both users appear in Active Speakers
- ✅ When User A leaves, count goes to 1
- ✅ Room data stays in sync for both users

---

## Test 9: Room Persistence 📊

**Steps:**
1. Create 3 rooms
2. Refresh the page
3. Check if rooms are still there

**Expected Results:**
- ✅ All 3 rooms appear after refresh
- ✅ Participant counts are accurate
- ✅ No duplicate rooms
- ✅ Database has correct data

---

## Debugging Tips

### Check Console Logs
```javascript
// Look for these patterns:
[API REQUEST]     // Request being sent
[API RESPONSE]    // Response received
[API ERROR]       // Network errors
[Voice Rooms Error] // Page-specific errors
[Join Room Error]   // Join operation errors
[Auth Error]      // Auth failures
```

### Network Tab Inspection
1. Filter by "Fetch/XHR"
2. Look for `/voice/rooms` requests
3. Check response status:
   - ✅ 200 = Success
   - ❌ 401 = Auth failed
   - ❌ 400 = Bad request
   - ❌ 404 = Not found
   - ❌ 500 = Server error

### Browser Storage
```javascript
// In DevTools Console:
// Check your JWT token
localStorage.getItem('auth-token')

// Check stored user
localStorage.getItem('auth-user')
```

### Test with Mock Auth (Development)
If running in development mode, you can test with mock headers:
```bash
# In backend, set:
NODE_ENV=development
ENABLE_MOCK_AUTH=true
```

Then frontend requests will work without a real JWT token.

---

## Expected Metrics

### Response Times
- Token generation: < 5ms
- Fetch rooms: 600-700ms
- Join room: < 500ms
- Leave room: < 500ms

### Polling Interval
- Rooms list updates every 5 seconds
- No lag or missed updates

### Participant Count
- Updates immediately after join
- Updates immediately after leave
- Accurate for concurrent users

---

## Failure Scenarios (Should NOT Happen)

❌ **SHOULD NOT SEE:**
- 401 on room list polling
- 401 on token generation (when authenticated)
- Silent 401 errors with no logging
- Duplicate rooms in list
- Incorrect participant counts
- Lost authentication mid-session

✅ **SHOULD SEE:**
- Clear error messages
- Proper HTTP status codes
- Console debugging logs
- Graceful error recovery
- Accurate participant tracking

---

## Quick Test Summary

| Test | Status | Expected Result |
|------|--------|-----------------|
| Create Room | ✅ | Room appears in list |
| Fetch Rooms | ✅ | No 401 errors |
| Join Room | ✅ | Participant count +1 |
| Polling While Joined | ✅ | No 401 errors |
| Leave Room | ✅ | Participant count -1 |
| Invalid Room | ✅ | Clear error message |
| Token Expiration | ✅ | Silent retry, no toast |
| Multiple Users | ✅ | Both users sync'd |
| Room Persistence | ✅ | Rooms survive refresh |

---

## Troubleshooting

### "Could not load voice rooms"
- Check backend is running
- Check network connectivity
- Check JWT token is valid
- Check CORS is configured

### "Could not join room"
- Check room still exists
- Check room is active (not closed)
- Check JWT token is valid
- Check backend logs for errors

### 401 Unauthorized errors
- Clear browser cookies/storage
- Login again to get new token
- Check JWT_SECRET matches between frontend and backend
- Check token hasn't expired

### Polling 401 errors only
- This suggests token is lost between requests
- Check API interceptor is attaching token
- Check auth store has valid token
- Refresh page to re-authenticate

---

## Success Criteria

You'll know the fix is working when:
1. ✅ First room fetch succeeds (200)
2. ✅ Subsequent polling requests succeed (200, not 401)
3. ✅ Token generation works (200)
4. ✅ Join/leave operations work (200)
5. ✅ No silent failures in console
6. ✅ Participant counts accurate
7. ✅ Multiple users can join the same room
8. ✅ Data persists across page refreshes
