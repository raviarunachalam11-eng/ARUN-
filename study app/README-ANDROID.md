# 📱 Android APK Build Instructions

## Quick Build (5 Steps)

### 1. Install Prerequisites
- **Node.js**: https://nodejs.org/ (Download and install)
- **Android Studio**: https://developer.android.com/studio (Download and install)

### 2. Run Build Script
**Windows:**
```
Double-click: build-android.bat
```

**Mac/Linux:**
```bash
chmod +x build-android.sh
./build-android.sh
```

### 3. Build APK in Android Studio
- Wait for Android Studio to open
- Wait for Gradle sync (shown at bottom)
- Click: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- Wait for build to complete

### 4. Find Your APK
- Click the "locate" link when build completes
- Or navigate to: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Install on Android
- Transfer APK to your Android device
- Enable "Install Unknown Apps" in Settings
- Open and install the APK

## ✅ All Features Included in APK:

- ✅ Study Management with CRUD
- ✅ Test Management with Batches
- ✅ Reports (PDF & Excel Export)
- ✅ Subject Management (Add/Edit/Delete)
- ✅ Date Filtering
- ✅ Offline Functionality
- ✅ Data Export/Import
- ✅ All CRUD Operations
- ✅ Complete TNPSC Study Tracking

## 🚀 Alternative: Online APK Builder

If you don't want to install Android Studio:

1. **Upload to web server** (GitHub Pages, Netlify, Vercel, etc.)
2. **Go to**: https://www.pwabuilder.com/
3. **Enter your URL**
4. **Click**: Android → Generate Package
5. **Download APK**

## 📝 Notes:

- The APK works offline after first load
- All data is stored locally on device
- No internet required after installation
- Can be shared with friends
- Works on all Android devices (Android 5.0+)

## 🛠️ Troubleshooting:

**"npm not found"**
→ Install Node.js from nodejs.org

**"Android SDK not found"**
→ Open Android Studio → Tools → SDK Manager → Install SDK

**Build fails**
→ Make sure you have internet (Gradle downloads dependencies)

**Can't install APK**
→ Enable "Install Unknown Apps" in Android Settings

---

**Your APK will be ready in minutes!** 🎉

