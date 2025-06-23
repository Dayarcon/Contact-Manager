# 🚀 Quick Testing Guide - Contact Manager App

## 🎯 Essential Features to Test First

### 1. 📱 Basic Contact Operations (5 minutes)

#### Add a New Contact
1. Open the app
2. Tap the `+` button
3. Fill in:
   - First Name: "John"
   - Last Name: "Doe"
   - Phone: "123-456-7890"
   - Email: "john@example.com"
   - Company: "Tech Corp"
   - Group: "Work"
4. Tap "Save Contact"
5. ✅ Verify contact appears in the list

#### Edit a Contact
1. Tap on the contact you just created
2. Tap the edit button (pencil icon)
3. Change the company to "New Company"
4. Tap "Save Changes"
5. ✅ Verify changes are saved

#### Delete a Contact
1. Open contact details
2. Tap the three dots menu
3. Select "Delete Contact"
4. Confirm deletion
5. ✅ Verify contact is removed from list

### 2. 🔍 Search & Filtering (3 minutes)

#### Basic Search
1. Use the search bar at the top
2. Type "John" - should find your contact
3. Type "Tech" - should find by company
4. Type "123" - should find by phone number
5. ✅ Verify search results are accurate

#### Filter by Group
1. Tap the filter icon
2. Select "Work" group
3. ✅ Verify only work contacts are shown
4. Clear filter
5. ✅ Verify all contacts are shown again

### 3. 📞 Quick Actions (5 minutes)

#### Phone Call
1. Open a contact with a phone number
2. Tap the phone icon
3. ✅ Verify phone app opens with correct number

#### WhatsApp Message
1. Open a contact with a phone number
2. Tap the WhatsApp icon in Quick Actions
3. ✅ Verify WhatsApp opens with pre-filled message

#### Email
1. Open a contact with an email address
2. Tap the email icon in Quick Actions
3. ✅ Verify email app opens with pre-filled content

### 4. 🔔 Notifications (5 minutes)

#### Set Up Birthday Reminder
1. Go to Settings → Automation Settings
2. Enable "Birthday Reminders"
3. Set reminder to "1 day before"
4. Go back and edit a contact
5. Add a birthday (tomorrow's date)
6. ✅ Verify notification is scheduled

#### Test Notification
1. Set a contact's birthday to today
2. Wait for notification (or check notification settings)
3. ✅ Verify notification appears

### 5. 📤 Contact Sharing (3 minutes)

#### Share as Text
1. Open any contact
2. Tap the three dots menu
3. Select "Share as Text"
4. ✅ Verify sharing sheet opens with formatted text

#### Share as vCard
1. Open any contact
2. Tap the three dots menu
3. Select "Share as vCard"
4. ✅ Verify vCard file is created and shared

### 6. 🏷️ Organization Features (3 minutes)

#### Mark as Favorite
1. Open a contact
2. Tap the heart icon
3. ✅ Verify contact appears in favorites
4. Go to home screen and check favorites section

#### Mark as VIP
1. Open a contact
2. Tap the VIP toggle
3. ✅ Verify VIP badge appears
4. Go to VIP settings to configure preferences

### 7. 📍 Location Features (5 minutes)

#### Grant Location Permission
1. Go to Settings → Location Settings
2. Tap "Enable Location Services"
3. Grant permission when prompted
4. ✅ Verify location is enabled

#### Nearby Contacts
1. Go to the Nearby tab
2. ✅ Verify nearby contacts are shown (if any)
3. Check distance calculations

### 8. 📊 Data Management (3 minutes)

#### Export Contacts
1. Go to Settings
2. Tap "Export Contacts"
3. Choose JSON format
4. ✅ Verify export file is created and shared

#### Backup Data
1. Go to Settings
2. Tap "Backup Contacts"
3. ✅ Verify backup is created successfully

## 🐛 Common Issues to Check

### Performance
- [ ] App starts quickly
- [ ] Contact list scrolls smoothly
- [ ] Images load properly
- [ ] No memory leaks

### Data Integrity
- [ ] Contacts persist after app restart
- [ ] No data corruption
- [ ] Backup/restore works correctly

### UI/UX
- [ ] All buttons are tappable
- [ ] Text is readable
- [ ] Layout looks good on your device
- [ ] Animations are smooth

## 🚨 Critical Bug Checks

### High Priority
- [ ] App doesn't crash on startup
- [ ] Can add/edit/delete contacts
- [ ] Search works correctly
- [ ] Data persists between sessions

### Medium Priority
- [ ] Notifications work
- [ ] Quick actions function
- [ ] Sharing works
- [ ] Location features work

### Low Priority
- [ ] All animations are smooth
- [ ] UI looks good on different screen sizes
- [ ] All settings are accessible

## 📱 Device-Specific Testing

### iOS
- [ ] FaceTime integration works
- [ ] iOS sharing sheet appears
- [ ] Dark/Light mode works

### Android
- [ ] Android sharing works
- [ ] Back button navigation
- [ ] Android-specific features work

## ⚡ Quick Commands

```bash
# Start the app
npx expo start

# Test on iOS
npx expo start --ios

# Test on Android
npx expo start --android

# Test on device
npx expo start --tunnel
```

## 📝 Test Results

After testing, note:
- ✅ What works well
- ❌ What needs fixing
- 🔧 Suggestions for improvement
- 📱 Device/OS tested

## 🎯 Priority Order

1. **Must Work**: Basic CRUD, search, data persistence
2. **Should Work**: Notifications, quick actions, sharing
3. **Nice to Have**: Location, advanced features, animations

---

**Time Estimate**: 30-45 minutes for complete testing
**Focus**: Test the most critical user workflows first 