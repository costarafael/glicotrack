# Suggested Commands for GlicoTrack Development

## Development Commands
- `npx react-native start` - Start Metro bundler
- `npx react-native run-android` - Run on Android
- `npx react-native run-ios` - Run on iOS

## Build Commands
- `./build.sh` - Build release APK (unified script)
- `./build.sh debug` - Build debug APK
- `cd android && ./install-apk.sh` - Install APK on device

## Quality Assurance
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npx react-native start --reset-cache` - Clear Metro cache

## iOS New Architecture
- `cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install`

## Clean Commands
- `cd android && ./gradlew clean` - Clean Android build
- `rm -rf node_modules && npm install` - Clean node modules