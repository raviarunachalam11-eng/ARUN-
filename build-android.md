# Build Android APK Instructions

## Option 1: Using Capacitor (Recommended)

### Prerequisites:
1. Install Node.js from https://nodejs.org/
2. Install Android Studio from https://developer.android.com/studio
3. Set up Android SDK (comes with Android Studio)

### Steps:

1. **Install dependencies:**
   ```bash
   npm install
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. **Initialize Capacitor:**
   ```bash
   npx cap init
   ```
   - App ID: `com.arunachalam.studyapp`
   - App Name: `ARUNACHALAM STUDY ANALYSE`
   - Web Dir: `dist`

3. **Build the web app:**
   ```bash
   npm run build
   ```

4. **Add Android platform:**
   ```bash
   npx cap add android
   ```

5. **Sync files:**
   ```bash
   npx cap sync
   ```

6. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

7. **Build APK in Android Studio:**
   - Wait for Gradle sync to complete
   - Go to Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Wait for build to complete
   - Click "locate" to find the APK file
   - APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

## Option 2: Using Online PWA Builder (Easiest - No Installation Needed)

1. Go to https://www.pwabuilder.com/
2. Enter your website URL (or use localhost if testing)
3. Click "Start"
4. Click "Android" option
5. Click "Generate Package"
6. Download the APK file

## Option 3: Manual APK Builder Script

I've created a simple script that will help you build. Run:
```bash
npm run build:android
```

## Note:
- For production APK, you need to sign it with a keystore
- Debug APK can be installed directly on Android devices
- Enable "Install from Unknown Sources" on your Android device to install the APK

