# 📱 Contact Manager App

A comprehensive, modern contact management application built with React Native and Expo. This app provides advanced contact organization, smart reminders, VIP contact management, automation features, and real push notifications.

## ✨ Features

### 🏠 Core Contact Management
- **Add/Edit/Delete Contacts** - Full CRUD operations with rich contact information
- **Contact Photos** - Add and manage contact profile pictures
- **Multiple Phone Numbers** - Support for multiple phone numbers with types (mobile, work, home)
- **Email Addresses** - Multiple email addresses with primary designation
- **Address Information** - Store and manage contact addresses
- **Social Media** - Link social media profiles
- **Birthday & Anniversary** - Track important dates with automatic reminders
- **Notes & Tags** - Add personal notes and custom labels
- **Contact Sharing** - Share contacts as text or vCard format with native sharing

### 🎯 Smart Organization
- **Groups & Categories** - Organize contacts into custom groups
- **Favorites System** - Mark important contacts as favorites
- **VIP Contacts** - Special handling for VIP contacts with enhanced features
- **Emergency Contacts** - Quick access to emergency contacts
- **Recent Contacts** - Track recently contacted people
- **Advanced Search** - Search by name, phone, email, company, or notes
- **Filtering Options** - Filter by groups, labels, favorites, VIP status

### 👑 VIP Contact Features
- **VIP Designation** - Mark contacts as VIP with special privileges
- **Enhanced Notifications** - Special notification handling for VIP contacts
- **DND Bypass Settings** - Configure VIP contacts to bypass Do Not Disturb
- **Silent Mode Bypass** - Allow VIP contacts to ring in silent mode
- **Custom Vibration** - Special vibration patterns for VIP calls
- **Emergency Bypass** - Override all restrictions for critical contacts
- **VIP Statistics** - Track VIP contact interactions and usage

### 🔔 Push Notifications & Smart Reminders
- **Real Push Notifications** - Actual local notifications for reminders and messages
- **Birthday Reminders** - Get notified before contacts' birthdays (configurable days in advance)
- **Anniversary Reminders** - Never miss important anniversaries
- **Location-Based Alerts** - Notifications when near specific contacts or locations
- **Message Reminders** - Get reminded to send scheduled messages
- **Quiet Hours** - Configure quiet hours to avoid notifications during specific times
- **Notification Settings** - Customize sound, vibration, and notification preferences
- **Notification History** - Track and manage all scheduled notifications

### 💬 Scheduled Messaging
- **Message Scheduling** - Schedule messages for birthdays, anniversaries, or custom dates
- **Multi-Platform Support** - Support for SMS, WhatsApp, Telegram, and Email
- **Custom Message Templates** - Create personalized message templates
- **Auto Message Generation** - Automatic birthday and anniversary messages
- **Message Status Tracking** - Track pending, sent, failed, and cancelled messages
- **Platform Preferences** - Set preferred messaging platform per contact
- **Message History** - View all scheduled and sent messages

### ⚡ Quick Actions

Smart multi-platform communication with intelligent app detection:

### **App Availability Detection**
- **Automatic Detection**: Automatically detects which apps are installed on your device
- **Real-time Status**: Shows availability status for WhatsApp, Telegram, FaceTime, SMS, and Email
- **Cached Results**: Stores detection results for better performance
- **Manual Refresh**: Option to refresh app detection when apps are installed/uninstalled

### **Available Actions**
- **📞 Phone Call**: Direct phone calls using device's phone app
- **📹 FaceTime**: Video calls (iOS only, if available)
- **💬 WhatsApp**: Send messages via WhatsApp with pre-filled greeting
- **📱 Telegram**: Send messages via Telegram with pre-filled greeting
- **💬 SMS**: Send text messages with pre-filled content
- **📧 Email**: Compose emails with pre-filled subject and body

### **Smart Features**
- **Conditional Display**: Only shows actions for apps that are actually installed
- **Visual Indicators**: Clear visual feedback for available vs unavailable apps
- **Fallback Options**: Provides web alternatives for some apps (WhatsApp Web, Telegram Web)
- **Contact Validation**: Only shows actions when contact has required information (phone/email)
- **Loading States**: Shows loading indicators during action execution
- **Error Handling**: Graceful error handling with user-friendly messages

### **Settings & Preferences**
- **Individual Toggles**: Enable/disable specific apps in quick actions
- **Show Unavailable**: Option to show unavailable apps with installation prompts
- **App Status Display**: Real-time status of all supported apps
- **Refresh Detection**: Manual refresh of app availability
- **Persistent Settings**: Settings are saved and restored across app sessions

### **Usage**
1. **View Quick Actions**: Available on contact details screen
2. **Check App Status**: Go to Settings → Quick Actions to see app availability
3. **Configure Preferences**: Toggle which apps to show in quick actions
4. **Execute Actions**: Tap any available action to open the respective app
5. **Install Missing Apps**: Tap unavailable actions to get installation prompts

### **Technical Implementation**
- **Linking API**: Uses React Native's Linking API to check app availability
- **URL Schemes**: Detects apps using their URL schemes (whatsapp://, tg://, etc.)
- **Caching System**: Stores detection results in AsyncStorage for performance
- **Cross-Platform**: Works on both iOS and Android with platform-specific features
- **Error Recovery**: Handles cases where apps become unavailable

### 🤖 Automation & Smart Features
- **Smart Reminders** - Intelligent birthday and anniversary reminders with push notifications
- **Auto Tagging** - Intelligent contact categorization based on information
- **Duplicate Detection** - Find and merge duplicate contacts with similarity scoring
- **Contact Timeline** - Track interaction history with contacts
- **Batch Automation** - Run automation features across all contacts
- **Location-Based Automation** - Trigger actions based on proximity to contacts

### 📊 Data Management
- **Export Options** - Export contacts in JSON, CSV, and vCard formats
- **Backup & Restore** - Create backups of your contact data
- **Import Support** - Import contacts from various formats
- **Data Analytics** - View contact statistics and insights
- **Contact Statistics** - Track favorites, VIP contacts, groups, and recent activity

### 🌍 Location Services
- **Real GPS Integration** - Full location tracking with proper permissions
- **Nearby Contacts** - Find contacts near your current location
- **Location Triggers** - Set up location-based reminders and alerts
- **Background Location** - Track location even when app is not in use
- **Location Settings** - Comprehensive location service configuration
- **Geo Contact Management** - Add and manage location data for contacts
- **Location Statistics** - View location service usage and statistics
- **Location Permissions** - Proper handling of location permissions

### 🎨 Modern UI/UX
- **Beautiful Design** - Modern, intuitive interface with Material Design
- **Dark/Light Themes** - Support for different theme preferences
- **Smooth Animations** - Fluid transitions and micro-interactions
- **Responsive Layout** - Optimized for different screen sizes
- **Accessibility** - Built with accessibility in mind
- **Quick Actions UI** - Beautiful quick action buttons with icons and labels

## 🛠️ Technical Stack

### Core Technologies
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript development
- **React Navigation** - Navigation and routing
- **React Native Paper** - Material Design components

### State Management
- **React Context** - Global state management
- **AsyncStorage** - Local data persistence
- **Custom Services** - Modular service architecture

### Notification System
- **Expo Notifications** - Local push notifications
- **Notification Scheduling** - Time-based and location-based notifications
- **Notification Management** - Cancel, update, and track notifications

### UI/UX Libraries
- **Styled Components** - CSS-in-JS styling
- **React Native Reanimated** - Smooth animations
- **Expo Linear Gradient** - Beautiful gradients
- **React Native Vector Icons** - Icon library
- **React Native Slider** - Custom slider components

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **Expo Router** - File-based routing

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contact-manager-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## 🚀 Usage

### Adding Contacts
1. Tap the `+` button on the home screen
2. Fill in contact information (name, phone, email, etc.)
3. Add a profile picture (optional)
4. Set groups, labels, and special designations
5. Save the contact

### Managing VIP Contacts
1. Open a contact's details
2. Tap the VIP toggle to mark as VIP
3. Configure VIP settings in the VIP Settings screen
4. Set up DND bypass and notification preferences

### Using Quick Actions
1. Open any contact's details
2. Use the Quick Actions section to:
   - Make phone calls
   - Send WhatsApp messages
   - Send Telegram messages
   - Make FaceTime calls (iOS)
   - Send SMS messages
   - Send emails
3. Actions are automatically enabled based on available contact information

### Setting Up Notifications
1. Go to Settings → Automation Settings
2. Enable Smart Reminders for birthdays and anniversaries
3. Configure notification preferences (sound, quiet hours, etc.)
4. Set reminder days in advance
5. Customize message templates

### Using Smart Features
1. **Reminders**: Enable birthday/anniversary reminders in Automation Settings
2. **Scheduled Messaging**: Set up automatic birthday and anniversary messages
3. **Duplicate Detection**: Use the Duplicates screen to find and merge duplicates
4. **Quick Actions**: Use the Quick Actions section for fast communication
5. **Advanced Search**: Use the search bar with filters for precise contact finding

### Location Features
1. Grant location permissions when prompted
2. Use Nearby Contacts to find contacts in your area
3. Set up location triggers for specific contacts or places
4. Configure background location tracking if needed

### Exporting Data
1. Go to Settings
2. Choose export format (JSON, CSV, vCard)
3. Share or save the exported file

### Sharing Contacts
1. Open any contact's details
2. Tap the three dots menu (⋮) in the top right
3. Choose from sharing options:
   - **Share as Text** - Share contact info as formatted text
   - **Share as vCard** - Share as standard vCard format
   - **Copy Contact Info** - Copy to clipboard for manual sharing
4. Use native sharing to send via any available app

## 📁 Project Structure

```
contact-manager-app/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── _layout.tsx        # Root layout configuration
│   ├── add-contact.tsx    # Add new contact screen
│   ├── contact-details.tsx # Contact details screen
│   ├── settings.tsx       # Settings screen
│   ├── automation-settings.tsx # Automation and notification settings
│   ├── vip-settings.tsx   # VIP contact settings
│   ├── location-settings.tsx # Location service settings
│   └── ...                # Other screens
├── context/               # React Context providers
│   └── ContactsContext.tsx # Main contacts state management
├── services/              # Business logic services
│   ├── NotificationService.ts # Push notification management
│   ├── SmartRemindersService.ts # Smart reminder system
│   ├── ScheduledMessagingService.ts # Message scheduling
│   ├── QuickActionsService.ts # Quick communication actions
│   ├── VIPContactService.ts # VIP contact management
│   ├── GeoLocationService.ts # Location services
│   └── AutoTaggingService.ts # Automatic contact tagging
├── components/            # Reusable UI components
│   ├── QuickActions.tsx   # Quick actions component
│   ├── LocationSettings.tsx # Location settings component
│   ├── ContactTimeline.tsx # Contact interaction timeline
│   └── ...                # Other components
├── assets/               # Images, fonts, and static assets
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🔧 Recent Updates & New Features

### ✅ Newly Implemented Features
- **Real Push Notifications** - Actual local notifications for reminders and messages
- **Enhanced Quick Actions** - WhatsApp, Telegram, FaceTime, SMS, Email integration
- **NotificationService** - Comprehensive notification management system
- **Smart Reminders with Notifications** - Birthday and anniversary reminders with real notifications
- **Scheduled Messaging with Notifications** - Message scheduling with notification reminders
- **QuickActionsService** - Multi-platform communication service
- **Notification Settings** - Quiet hours, sound preferences, and notification management
- **Location-Based Notifications** - Notifications when near contacts or locations

### 🚀 Current Status
- ✅ App starts without native module errors
- ✅ All routing works correctly
- ✅ Core contact management features fully functional
- ✅ VIP contact system operational
- ✅ Smart reminders with real push notifications
- ✅ Scheduled messaging with notification reminders
- ✅ Quick actions for multiple communication platforms
- ✅ Location services with proper permissions
- ✅ Modern UI with smooth animations
- ✅ Data persistence and export features
- ✅ Comprehensive notification system

## 🎯 Key Features Status

| Feature | Status | Implementation Details |
|---------|--------|----------------------|
| Contact CRUD | ✅ Working | Full add/edit/delete functionality |
| Contact Photos | ✅ Working | Image picker integration |
| VIP Contacts | ✅ Working | Enhanced notification settings with real notifications |
| Smart Reminders | ✅ Working | Birthday/anniversary reminders with push notifications |
| Scheduled Messaging | ✅ Working | Message scheduling with notification reminders |
| Quick Actions | ✅ Working | WhatsApp, Telegram, FaceTime, SMS, Email integration |
| Push Notifications | ✅ Working | Real local notifications for all reminder types |
| Duplicate Detection | ✅ Working | Find and merge duplicates |
| Export/Import | ✅ Working | Multiple format support |
| Advanced Search | ✅ Working | Multi-field search with filters |
| Location Services | ✅ Working | GPS integration with proper permissions |
| Notification Management | ✅ Working | Schedule, cancel, and manage notifications |

## 🔔 Notification Features

### Supported Notification Types
- **Birthday Reminders** - Configurable days in advance
- **Anniversary Reminders** - Never miss important dates
- **Location Alerts** - When near specific contacts or places
- **Message Reminders** - Reminders to send scheduled messages
- **Custom Reminders** - User-defined reminders

### Notification Settings
- **Quiet Hours** - Configure times when notifications are delayed
- **Sound Preferences** - Enable/disable notification sounds
- **Vibration Settings** - Customize vibration patterns
- **Platform-Specific** - Enable/disable notifications by type
- **Contact-Specific** - Different settings for VIP contacts

## 🎨 UI/UX Improvements

### Add New Contact Screen Enhancements
- **Modern Flat Design** - Clean, minimalist interface without shadows for a contemporary look
- **Improved Visual Hierarchy** - Better spacing, typography, and layout organization
- **Enhanced Form Validation** - Real-time validation with visual feedback and progress indicators
- **Better User Experience** - Loading states, smooth animations, and intuitive interactions
- **Accessibility Improvements** - Better contrast, touch targets, and screen reader support
- **Consistent Styling** - Unified color scheme and design language throughout the form
- **Smart Defaults** - Pre-filled form fields and intelligent suggestions
- **Floating Save Button** - Always-accessible save action with visual feedback
- **Progress Tracking** - Visual progress indicator showing form completion status
- **Clean Contact Fields** - Removed blue accents for a cleaner, more professional appearance

### Design Philosophy
- **Flat Design** - Removed shadows and elevation for a modern, clean aesthetic
- **Material Design Principles** - Following Google's Material Design guidelines
- **Responsive Layout** - Optimized for various screen sizes and orientations
- **Intuitive Navigation** - Clear visual cues and logical information flow
- **Professional Appearance** - Business-ready interface suitable for professional use

## 🎉 What's New

This update brings significant improvements to the contact management experience:

1. **Real Notifications** - No more console logs! Get actual push notifications for all reminders
2. **Multi-Platform Communication** - Quick access to WhatsApp, Telegram, FaceTime, and more
3. **Enhanced Automation** - Smart reminders and scheduled messaging with real notifications
4. **Better User Experience** - Improved UI components and smoother interactions
5. **Comprehensive Settings** - Fine-tune notification preferences and automation features
6. **Modern Flat Design** - Clean, minimalist Add New Contact screen without shadows
7. **Enhanced Form Experience** - Better validation, progress tracking, and visual feedback
8. **Professional Appearance** - Removed blue accents for a cleaner, business-ready interface
9. **Contact Sharing** - Share contacts as text or vCard format with native sharing capabilities

The app now provides a complete contact management solution with real notifications, multi-platform communication capabilities, contact sharing, and a modern, professional user interface!

## 🔧 Google OAuth Configuration

### Setup Instructions

1. **Google Cloud Console Configuration**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API and Google People API
   - Go to "Credentials" and create OAuth 2.0 Client IDs for:
     - Android: Use package name `com.freefworlds.contactly`
     - iOS: Use bundle ID `com.freefworlds.contactly`
     - Web: Use redirect URI `https://auth.expo.io/@freefworlds/contactly`

2. **Client IDs**
   - Update the client IDs in `hooks/useGoogleAuth.ts` with your actual Google Cloud Console client IDs:
     - `GOOGLE_WEB_CLIENT_ID`: Your web client ID
     - `GOOGLE_IOS_CLIENT_ID`: Your iOS client ID

3. **Android Configuration**
   - Ensure your `android/app/build.gradle` includes the Google Play Services dependency
   - The app uses `@react-native-google-signin/google-signin` for native authentication

### Authentication Flow Fix

The app now properly handles Google OAuth authentication using the native Google Sign-In library with the following improvements:

- **Native Authentication**: Uses `@react-native-google-signin/google-signin` for reliable native authentication
- **Success Callback**: Automatically navigates to home screen after successful authentication
- **Error Handling**: Proper error messages and fallback mechanisms
- **Token Management**: Secure token storage and automatic refresh
- **No Redirect Issues**: Native authentication eliminates redirect URI problems

### Troubleshooting

If you encounter authentication issues:

1. **Check Google Cloud Console**: Ensure all client IDs are properly configured
2. **Verify Client IDs**: Make sure the client IDs match your Google Cloud Console setup
3. **Check Network**: Ensure the device has internet connectivity
4. **Clear Cache**: Clear app cache and try again
5. **Check Play Services**: Ensure Google Play Services is available on Android devices

### Migration from expo-auth-session

The app has been migrated from `expo-auth-session` to `@react-native-google-signin/google-signin` to resolve module compatibility issues and provide more reliable authentication.

## 📦 Installation

## 🔧 Recent Fixes

### Google Contacts Integration (Latest)
- **Fixed Contact Import**: Google sign-in now properly fetches and imports all contacts from Google Contacts
- **Enhanced Contact Mapping**: Improved parsing of Google contact fields (names, phones, emails, organizations, addresses, birthdays, etc.)
- **Automatic Sync**: Contacts are automatically synced after successful Google sign-in
- **Manual Sync**: Added manual sync button in Settings for on-demand contact synchronization
- **Better Error Handling**: Improved error messages and fallback behavior
- **Contact Deduplication**: Prevents importing duplicate contacts from Google

### Key Improvements
- Contacts are now properly imported with all available fields from Google
- Automatic sync happens immediately after Google sign-in
- Manual sync option available in Settings > Google Integration
- Better error handling and user feedback
- Contact structure now matches the app's Contact interface

## 📋 Usage

### Google Contacts Sync
1. Tap the Google icon in the search bar or go to Settings > Google Integration
2. Sign in with your Google account
3. Contacts will automatically sync from Google Contacts
4. Use the "Sync Google Contacts" button in Settings for manual sync

### Managing Contacts
- **Add Contact**: Tap the + button on the home screen
- **Edit Contact**: Tap on any contact to view details, then tap the edit button
- **Search**: Use the search bar to find contacts by name, company, phone, or email
- **Filter**: Use the filter chips to view favorites, VIP contacts, or contacts by group
- **Quick Actions**: Swipe left on contacts for quick actions like call, message, or email

## 🛠️ Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **UI Components**: React Native Paper
- **Styling**: Styled Components
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Google Integration**: @react-native-google-signin/google-signin
- **Animations**: React Native Reanimated

## 📄 License

This project is licensed under the MIT License.