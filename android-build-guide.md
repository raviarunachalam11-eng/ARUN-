# Android APK Build Guide - ARUNACHALAM STUDY ANALYSE

## Quick Start (Easiest Method)

### Method 1: Using PWA Builder (No Installation Required)

1. **Deploy your app** (or use localhost):
   - If you have a web server, upload all files
   - Or use a local server: `python -m http.server 8000`

2. **Go to PWA Builder:**
   - Visit: https://www.pwabuilder.com/
   - Enter your app URL
   - Click "Start"
   - Click "Android" option
   - Click "Generate Package"
   - Download the APK file

### Method 2: Using Capacitor (Full Control)

#### Prerequisites:
1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Install the LTS version

2. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install and open Android Studio
   - Go to Tools > SDK Manager
   - Install Android SDK (API level 33 or higher)
   - Accept all licenses

3. **Set Environment Variables** (Windows):
   - Add to System Environment Variables:
     - `ANDROID_HOME` = `C:\Users\YourUsername\AppData\Local\Android\Sdk`
     - Add to PATH: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools`

#### Build Steps:

1. **Open Command Prompt/PowerShell in project folder:**
   ```
   cd "E:\study app"
   ```

2. **Run the build script:**
   ```
   build-android.bat
   ```
   
   This will:
   - Install dependencies
   - Set up Capacitor
   - Create Android project
   - Open Android Studio

3. **In Android Studio:**
   - Wait for Gradle sync (bottom status bar)
   - Go to: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - Wait for build to complete
   - Click "locate" link when build finishes
   - APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

4. **Install APK on Android:**
   - Transfer APK to your Android device
   - Enable "Install from Unknown Sources" in Settings
   - Open the APK file and install

## Manual Build (If script doesn't work):

```bash
# Install dependencies
npm install

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android --save

# Initialize Capacitor
npx cap init "ARUNACHALAM STUDY ANALYSE" "com.arunachalam.studyapp" --web-dir="."

# Add Android platform
npx cap add android

# Sync files
npx cap sync android

# Open Android Studio
npx cap open android
```

Then follow step 3 above to build APK in Android Studio.

## Troubleshooting:

- **"npm not found"**: Install Node.js from nodejs.org
- **"Android SDK not found"**: Install Android Studio and SDK
- **Gradle sync fails**: Check internet connection, Android Studio will download dependencies
- **Build fails**: Make sure Android SDK is properly installed

## Features Included in APK:
✅ All study tracking features
✅ All test management features
✅ Reports with PDF/Excel export
✅ Offline functionality
✅ Data stored locally
✅ All CRUD operations
✅ Subject management
✅ Batch management
✅ Date filtering

