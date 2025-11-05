@echo off
REM Build script for Android APK (Windows)

echo Building ARUNACHALAM STUDY ANALYSE for Android...

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

echo Installing Capacitor...
call npm install @capacitor/core @capacitor/cli @capacitor/android --save

echo Initializing Capacitor...
if not exist "capacitor.config.json" (
    call npx cap init "ARUNACHALAM STUDY ANALYSE" "com.arunachalam.studyapp" --web-dir="."
) else (
    echo Capacitor already initialized
)

echo Adding Android platform...
call npx cap add android || echo Android platform already added

echo Syncing files...
call npx cap sync android

echo.
echo ========================================
echo Build completed!
echo ========================================
echo.
echo Next steps:
echo 1. Open Android Studio
echo 2. Open the "android" folder in Android Studio
echo 3. Wait for Gradle sync to complete
echo 4. Go to Build ^> Build Bundle(s^) / APK(s^) ^> Build APK(s^)
echo 5. Find APK in: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Opening Android Studio...
call npx cap open android

pause

