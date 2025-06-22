# 📱 Contact Manager App

A modern, feature-rich contact management application built with React Native and Expo. This app provides a comprehensive solution for managing personal and business contacts with advanced features like duplicate detection, quick actions, and data export capabilities.

## 🚀 Features

### 📋 Core Contact Management
- **Add/Edit/Delete Contacts** - Full CRUD operations for contact management
- **Contact Details** - Comprehensive contact information including:
  - Personal details (name, company, job title)
  - Multiple phone numbers with types (mobile, work, home, other)
  - Multiple email addresses with types (personal, work, other)
  - Address information
  - Social media handles
  - Website URLs
  - Birthday and anniversary dates
  - Notes and labels
  - Emergency contact designation

### 🎨 Enhanced UI/UX Features
- **Contact Avatars with Initials** - Beautiful colored avatars with contact initials
  - Dynamic color generation based on contact name
  - Support for custom contact photos
  - Favorite badge overlay for important contacts
- **Swipeable Actions** - Quick access to common actions
  - Swipe right to reveal call, message, and delete buttons
  - Color-coded action buttons (green for call, blue for message, red for delete)
  - Smooth swipe animations with haptic feedback
- **Contact Timeline View** - Social feed-style interaction history
  - Chronological display of all contact interactions
  - Color-coded event types with icons
  - Collapsible timeline for better space management
  - Recent activity tracking and display
- **Drag-and-Drop Reordering** - Intuitive contact organization
  - Reorder contacts within groups using drag-and-drop
  - Visual feedback during drag operations
  - Smooth animations and transitions
  - Available in the manage-contacts screen

### 🔍 Advanced Search & Filtering
- **Real-time Search** - Instant search across all contact fields
- **Smart Filtering** - Filter by groups, favorites, and contact types
- **Advanced Search** - Multi-field search with customizable filters
- **Search History** - Track and reuse previous search queries

### 🏷️ Organization & Categorization
- **Contact Groups** - Organize contacts into custom groups (Work, Family, Friends, etc.)
- **Labels & Tags** - Add custom labels to contacts for better organization
- **Favorites** - Mark important contacts as favorites for quick access
- **Emergency Contacts** - Designate and quickly access emergency contacts

### 🔄 Duplicate Management
- **Automatic Duplicate Detection** - Smart algorithm to find potential duplicates
- **Similarity Scoring** - Percentage-based similarity calculation
- **Merge Functionality** - Safely merge duplicate contacts with conflict resolution
- **Duplicate Review** - Side-by-side comparison of duplicate contacts

### ⚡ Quick Actions
- **One-tap Communication** - Direct call, message, email, and video call
- **Social Media Integration** - Quick access to WhatsApp, social profiles
- **Location Services** - Open addresses in maps applications
- **Website Access** - Direct links to contact websites
- **Calendar Integration** - Add birthdays and anniversaries to calendar
- **Contact Sharing** - Share contact information via various platforms

### 📊 Analytics & Insights
- **Contact Statistics** - Total contacts, favorites, group distribution
- **Recent Activity** - Track recent interactions and updates
- **Contact History** - Maintain interaction history for each contact
- **Usage Analytics** - Monitor app usage patterns

### 📤 Data Management
- **Export Options** - Export contacts in multiple formats:
  - JSON format for data backup
  - CSV format for spreadsheet applications
  - vCard format for universal compatibility
- **Import Functionality** - Import contacts from various sources
- **Backup & Restore** - Secure data backup and restoration
- **Data Validation** - Ensure data integrity and consistency

### 🎨 Modern UI/UX
- **Material Design 3** - Modern, intuitive interface
- **Dark/Light Theme** - Automatic theme switching based on system preferences
- **Smooth Animations** - Fluid transitions and micro-interactions
- **Responsive Design** - Optimized for various screen sizes
- **Accessibility** - Support for screen readers and accessibility features
- **Enhanced Visual Design** - Improved spacing, typography, and visual hierarchy

### 📱 Platform Features
- **Cross-platform** - Works on iOS, Android, and Web
- **Offline Support** - Full functionality without internet connection
- **Local Storage** - Secure local data storage using AsyncStorage
- **Image Support** - Contact photos with camera and gallery integration
- **Haptic Feedback** - Tactile feedback for better user experience

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: Expo Router with file-based routing
- **State Management**: React Context API with custom hooks
- **UI Components**: React Native Paper (Material Design 3)
- **Styling**: Styled Components with NativeWind
- **Storage**: AsyncStorage for local data persistence
- **Animations**: React Native Reanimated
- **Icons**: Expo Vector Icons
- **Gesture Handling**: React Native Gesture Handler

### Project Structure
```
contact-manager-app/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── index.tsx      # Home screen with contact list
│   │   ├── quick-actions.tsx  # Quick actions screen
│   │   ├── manage-contacts.tsx # Contact management with drag-and-drop
│   │   └── explore.tsx    # Explore and discover features
│   ├── add-contact.tsx    # Add new contact screen
│   ├── contact-details.tsx # Contact details and timeline view
│   ├── edit-contact.tsx   # Edit existing contact
│   ├── duplicates.tsx     # Duplicate detection and merging
│   └── settings.tsx       # App settings and data management
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── ContactListItem.tsx # Enhanced contact item with swipeable actions
│   ├── ContactTimeline.tsx # Timeline view for contact interactions
│   ├── DraggableContactList.tsx # Drag-and-drop contact list
│   ├── Collapsible.tsx
│   └── ThemedText.tsx
├── context/              # React Context providers
│   ├── ContactsContext.tsx # Contact data management
│   └── ThemeContext.tsx   # Theme management
├── hooks/                # Custom React hooks
├── constants/            # App constants and configuration
├── assets/              # Images, fonts, and static assets
└── scripts/             # Build and utility scripts
```

### Data Models

#### Contact Model
```typescript
type Contact = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phoneNumbers: PhoneNumber[];
  emailAddresses: EmailAddress[];
  businessType: string;
  address: string;
  socialMedia: string;
  website?: string;
  birthday?: string;
  anniversary?: string;
  isFavorite: boolean;
  group: string;
  notes?: string;
  history?: { type: string; detail: string; date: string }[];
  imageUri?: string;
  isEmergencyContact?: boolean;
  emergencyContact?: string;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
};
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contact-manager-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on your preferred platform**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

### Environment Setup

The app uses Expo's managed workflow, so most configurations are handled automatically. However, you may need to:

1. **Configure Expo account** (optional but recommended)
2. **Set up development certificates** for iOS/Android builds
3. **Configure app.json** for your specific app details

## 📖 Usage Guide

### Adding a New Contact
1. Tap the "+" button on the home screen
2. Fill in the contact information in the multi-step form
3. Add phone numbers and email addresses as needed
4. Set contact photo (optional)
5. Assign to groups and add labels
6. Save the contact

### Managing Contacts
- **View Details**: Tap on any contact to view full details and timeline
- **Edit Contact**: Use the edit button in contact details
- **Delete Contact**: Swipe left on contact or use delete option in details
- **Mark as Favorite**: Use the star icon to mark important contacts
- **Quick Actions**: Swipe right on contacts to access call, message, and delete actions

### Using Enhanced Features
- **Contact Timeline**: View interaction history in the contact details screen
- **Drag-and-Drop**: Reorder contacts in the manage-contacts screen
- **Swipeable Actions**: Swipe right on any contact for quick access to common actions
- **Contact Avatars**: See beautiful colored avatars with contact initials

### Finding and Filtering
- **Search**: Use the search bar to find contacts by name, company, or phone
- **Filter by Group**: Use the filter chips to show specific groups
- **Show Favorites**: Toggle to show only favorite contacts
- **Advanced Search**: Use multiple criteria for complex searches

### Duplicate Management
1. Navigate to the Duplicates screen
2. Review detected duplicates
3. Compare contact information side-by-side
4. Choose which information to keep during merge
5. Confirm the merge operation

### Quick Actions
- **Call**: Direct phone call (via swipe action or contact details)
- **Message**: Send SMS or use messaging apps
- **Email**: Compose and send email
- **Video Call**: Initiate video calls
- **WhatsApp**: Open WhatsApp chat
- **Maps**: View contact address on map
- **Website**: Open contact's website
- **Share**: Share contact information

### Data Export
1. Go to Settings screen
2. Choose export format (JSON, CSV, or vCard)
3. Select export destination
4. Download or share the exported file

## 🔧 Configuration

### App Configuration (`app.json`)
```json
{
  "expo": {
    "name": "contact-manager-app",
    "slug": "contact-manager-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.contactmanagerapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.anonymous.contactmanagerapp"
    }
  }
}
```

### Theme Configuration
The app supports automatic theme switching based on system preferences. Custom themes can be configured in `context/ThemeContext.tsx`.

## 🚀 Deployment

### Building for Production

1. **Configure app.json** with your app details
2. **Build the app**:
   ```bash
   # iOS
   expo build:ios
   
   # Android
   expo build:android
   ```

3. **Submit to app stores**:
   - iOS: Use App Store Connect
   - Android: Use Google Play Console

### Web Deployment
```bash
expo build:web
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the code comments for implementation details

## 🔮 Future Enhancements

- **Cloud Sync**: Sync contacts across devices
- **Contact Import**: Import from phone contacts, Google, iCloud
- **Advanced Analytics**: Detailed usage statistics and insights
- **Custom Fields**: Add custom contact fields
- **Contact Templates**: Pre-defined contact templates
- **Batch Operations**: Bulk edit and delete operations
- **Contact Backup**: Automated cloud backup
- **Integration APIs**: Connect with CRM systems and other apps
- **Voice Commands**: Voice-activated contact management
- **AI-Powered Features**: Smart contact suggestions and organization

---

**Built with ❤️ using React Native and Expo**
