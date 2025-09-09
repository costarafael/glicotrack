# GlicoTrack v2.2 Project Overview

## Purpose
Glucose monitoring app with React Native v0.80.2 (New Architecture), offline-first with Firebase sync, reminders, and PDF export.

## Tech Stack
- React Native 0.80.2 + New Architecture (TurboModules/Fabric)
- MMKV v3.3.0 for local storage + Firebase Firestore for sync
- React Navigation v7+, React Native Elements v4+
- @notifee/react-native for notifications
- react-native-html-to-pdf for PDF generation

## Key Data Types
- DailyLog: Contains date, glucoseEntries, bolusEntries, basalEntry, notes
- Firebase structure: users/{userKey}/daily_logs/{YYYY-MM-DD}
- User key format: 8 characters (e.g., V60PFBX1)

## Critical Rules
- Always use error?.code || 'unknown' and error?.message || 'Unknown error'
- Always use safeToISOString(timestamp) instead of direct .toISOString()
- Always rebuild APK after Firebase service changes
- Feature flags control functionality (COMPANION_MODE currently disabled)

## Main Commands
- npx react-native start
- npx react-native run-android
- ./build.sh (for release builds)
- npm run lint, npm run test