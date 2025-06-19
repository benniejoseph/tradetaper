# Notes Manual Testing Guide

This guide provides step-by-step instructions for manually testing all notes functionality.

## Prerequisites

1. **Backend deployed**: https://tradetaper-backend-481634875325.us-central1.run.app
2. **Frontend deployed**: https://tradetaper-frontend-benniejosephs-projects.vercel.app
3. **Test user account**: Register or use existing account
4. **Browser**: Chrome/Firefox with DevTools open

## Test Plan

### 1. Authentication & Setup
- [ ] Open frontend URL
- [ ] Register new account or login with existing account
- [ ] Verify successful authentication (redirected to dashboard)
- [ ] Open DevTools Console to monitor API calls

### 2. Notes Page Access
- [ ] Navigate to `/notes` from main navigation
- [ ] Verify page loads without errors
- [ ] Check console for API configuration logs
- [ ] Verify "New Note" button is visible

### 3. Create New Note
- [ ] Click "New Note" button
- [ ] Navigate to `/notes/new`
- [ ] Verify page loads without JavaScript errors
- [ ] Test the title input field

#### 3.1 Basic Text Entry
- [ ] Enter note title: "Test Note Manual"
- [ ] Type in first text block: "This is a manual test note"
- [ ] Verify auto-save indicator appears
- [ ] Wait 2 seconds for auto-save to trigger

#### 3.2 Block Operations
- [ ] Press Enter to create new text block
- [ ] Type "/" to open block menu
- [ ] Select "Heading" from menu
- [ ] Type heading text: "Test Heading"
- [ ] Press Enter to create another block
- [ ] Type "/" and select "Quote"
- [ ] Add quote text and author

#### 3.3 Tags Management
- [ ] Click "Add tag" button
- [ ] Type "manual-test" and press Enter
- [ ] Add another tag: "testing"
- [ ] Remove one tag by clicking X
- [ ] Verify tags are preserved

#### 3.4 Save Operations
- [ ] Click "Save Note" button
- [ ] Verify success toast appears
- [ ] Check if redirected to note view page
- [ ] Verify note content is displayed correctly

### 4. Notes List & Search
- [ ] Navigate back to `/notes`
- [ ] Verify created note appears in list
- [ ] Test search functionality:
  - [ ] Search for "manual" - should find your note
  - [ ] Search for "nonexistent" - should show no results
  - [ ] Clear search and verify all notes return

#### 4.1 Filtering
- [ ] Test tag filtering (if UI exists)
- [ ] Test date filtering (if UI exists)
- [ ] Test pagination (if multiple notes exist)

### 5. Note Viewing & Editing
- [ ] Click on your test note from the list
- [ ] Verify note opens in view mode
- [ ] Check that all content blocks display correctly
- [ ] Test edit functionality:
  - [ ] Click edit button (if exists)
  - [ ] Modify title
  - [ ] Add new content block
  - [ ] Save changes
  - [ ] Verify changes persist

### 6. Advanced Features
#### 6.1 Calendar View
- [ ] Navigate to `/notes/calendar` (if route exists)
- [ ] Verify calendar displays correctly
- [ ] Check if notes appear on correct dates

#### 6.2 Voice Recording (if implemented)
- [ ] Look for microphone button in text blocks
- [ ] Test voice recording functionality
- [ ] Verify transcription works

### 7. Error Handling Tests
#### 7.1 Network Issues
- [ ] Disconnect internet while creating note
- [ ] Verify appropriate error message
- [ ] Reconnect and verify retry works

#### 7.2 Authentication Expiry
- [ ] Clear localStorage token
- [ ] Try to access protected route
- [ ] Verify redirect to login

#### 7.3 Invalid Data
- [ ] Try to create note with empty title and content
- [ ] Verify validation messages

### 8. Mobile Responsiveness
- [ ] Test on mobile device or DevTools mobile view
- [ ] Verify touch interactions work
- [ ] Check that layout adapts properly
- [ ] Test block menu on mobile

### 9. Performance Tests
- [ ] Create note with many blocks (20+)
- [ ] Test auto-save performance
- [ ] Monitor memory usage
- [ ] Check for console errors

### 10. Cross-browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge

## Expected API Calls

Monitor these API calls in DevTools Network tab:

### During Note Creation:
```
POST /api/v1/notes
- Should return 200/201
- Response should contain note ID
- Request should include all note data
```

### During Auto-save:
```
POST /api/v1/notes (for new notes)
PATCH /api/v1/notes/:id (for existing notes)
- Should trigger every 2 seconds after changes
- Should not trigger for empty notes
```

### During Notes List:
```
GET /api/v1/notes
GET /api/v1/notes/stats
GET /api/v1/notes/tags
- Should all return 200
- Should contain proper data structures
```

## Console Logs to Check

Look for these logs in browser console:

```javascript
🔧 API Configuration: {
  env: "production",
  apiUrl: "https://tradetaper-backend-481634875325.us-central1.run.app/api/v1",
  envVar: "https://tradetaper-backend-481634875325.us-central1.run.app/api/v1",
  timestamp: "..."
}

🚀 Making authenticated API request to: https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/notes
```

## Common Issues & Solutions

### Issue: 404 Not Found
**Check**: 
- Environment variables in Vercel
- API URL configuration
- Network tab for actual URL being called

### Issue: 401 Unauthorized
**Check**:
- Authentication token in localStorage
- Token expiry
- Login status

### Issue: 500 Internal Server Error
**Check**:
- Backend logs in GCP
- Database connection
- Request payload format

### Issue: Auto-save not working
**Check**:
- Console for errors
- Network tab for API calls
- useDebounce hook functionality

## Test Data Cleanup

After testing:
- [ ] Delete test notes created
- [ ] Clear test tags if needed
- [ ] Verify no test data remains

## Reporting Issues

When reporting issues, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser and version**
5. **Console errors**
6. **Network tab screenshot**
7. **Environment** (production/development)

## Test Sign-off

| Test Category | Status | Notes |
|---------------|--------|-------|
| Authentication | ⬜ Pass / ⬜ Fail | |
| Note Creation | ⬜ Pass / ⬜ Fail | |
| Note Editing | ⬜ Pass / ⬜ Fail | |
| Search & Filter | ⬜ Pass / ⬜ Fail | |
| Auto-save | ⬜ Pass / ⬜ Fail | |
| Error Handling | ⬜ Pass / ⬜ Fail | |
| Mobile Support | ⬜ Pass / ⬜ Fail | |
| Performance | ⬜ Pass / ⬜ Fail | |

**Tester**: ________________  
**Date**: ________________  
**Environment**: ________________  
**Overall Status**: ⬜ Pass / ⬜ Fail 