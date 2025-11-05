#!/bin/bash
# Build script for Android APK

echo "Building ARUNACHALAM STUDY ANALYSE for Android..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Installing Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android --save

echo "Initializing Capacitor..."
npx cap init "ARUNACHALAM STUDY ANALYSE" "com.arunachalam.studyapp" --web-dir="." || true

echo "Adding Android platform..."
npx cap add android || true

echo "Syncing files..."
npx cap sync android

echo "Opening Android Studio..."
echo "Please build APK in Android Studio:"
echo "1. Wait for Gradle sync"
echo "2. Go to Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "3. Find APK in: android/app/build/outputs/apk/debug/app-debug.apk"

npx cap open android

