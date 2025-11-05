# Study App - TNPSC Preparation

A simple web application for TNPSC exam aspirants to track daily study progress and manage test scores. Built with pure HTML, CSS, and JavaScript - no build tools required!

## Features

- **User Authentication**: Login and registration system
- **Study Management**: 
  - Track daily study progress by subject
  - Record topics, pages studied, and revision dates
  - Subjects: Tamil, History, TN History, Economics, Polity, Geography, Science, Current Affairs, English, General Knowledge
- **Test Management**:
  - Record test scores with automatic percentage calculation
  - Subject-wise breakdown for each test
  - Red highlighting for scores below 85%
  - Full CRUD operations with confirmation dialogs
- **Data Export/Import**: Share your data with friends via JSON export/import
- **Offline Support**: Works completely offline using IndexedDB
- **No Installation Required**: Just open the HTML files in your browser!

## How to Use

### For Windows:
1. Simply double-click `index.html` to open in your default browser
2. Or right-click and select "Open with" → Choose your browser (Chrome, Edge, Firefox)

### For Android:
1. Transfer all files to your Android device
2. Open `index.html` using a file manager app that supports opening HTML files
3. Or use a browser app like Chrome/Firefox to open the file

### For Sharing:
- Export your data from the Dashboard using the "Export Data" button
- Share the JSON file with friends
- Friends can import the data using the "Import Data" button

## File Structure

```
study-app/
├── index.html          # Login page
├── register.html       # Registration page
├── dashboard.html      # Main dashboard
├── study.html          # Study management page
├── test.html           # Test management page
├── styles.css          # All styles
└── js/
    ├── database.js     # IndexedDB database operations
    ├── auth.js         # Authentication functions
    ├── login.js        # Login page logic
    ├── register.js     # Registration page logic
    ├── dashboard.js    # Dashboard logic
    ├── study.js        # Study page logic
    └── test.js         # Test page logic
```

## Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling (no frameworks)
- **Vanilla JavaScript** - All functionality
- **IndexedDB** - Local database storage

## Notes

- All data is stored locally in your browser (IndexedDB)
- No data is sent to any server - completely private
- Works offline after first load
- No build process or dependencies needed
- Just open and use!

## Browser Compatibility

Works on all modern browsers:
- Chrome (recommended)
- Edge
- Firefox
- Safari
- Opera

## Usage Instructions

1. **First Time**: Open `index.html` and register a new account
2. **Login**: Use your credentials to login
3. **Study**: Click on "Study" folder, select a subject, and add your study records
4. **Test**: Click on "Test" folder, add test scores, and track your performance
5. **Export/Import**: Use the buttons on Dashboard to backup or share your data

Enjoy studying for your TNPSC exam! 🎓
