#!/bin/bash

# iOS Debug Build Script for Local Testing
# Reproduces GitHub Actions environment locally

echo "🚀 Starting iOS Debug Build (Local Testing)"
echo "==========================================="

# Set environment variables
export RCT_NEW_ARCH_ENABLED=1
export USE_HERMES=1

echo "📱 Environment Configuration:"
echo "  - RCT_NEW_ARCH_ENABLED: $RCT_NEW_ARCH_ENABLED"
echo "  - USE_HERMES: $USE_HERMES"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install --legacy-peer-deps
fi

# Navigate to iOS directory
cd ios

echo "🧹 Cleaning previous builds..."
rm -rf Pods Podfile.lock build
rm -rf ~/Library/Developer/Xcode/DerivedData/GlicoTrack-* 2>/dev/null || true

echo "☕ CocoaPods Installation:"
echo "  - Version: $(pod --version)"
echo "  - Ruby: $(ruby --version)"

# Clean pods cache
pod cache clean --all 2>/dev/null || true

echo "📱 Installing CocoaPods dependencies..."
if ! pod install --repo-update > pod_install.log 2>&1; then
  echo "⚠️ Pod install failed, showing last 50 lines:"
  tail -50 pod_install.log
  echo "🔄 Retrying..."
  pod install --repo-update
else
  echo "✅ Pod install completed successfully"
fi

echo "🔨 Building iOS App (Debug/Simulator)..."
echo "  - Configuration: Debug with leveldb fixes"
echo "  - SDK: iphonesimulator"
echo "  - Code Signing: Disabled"

xcodebuild \
  -workspace GlicoTrack.xcworkspace \
  -scheme GlicoTrack \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  PROVISIONING_PROFILE="" \
  DEVELOPMENT_TEAM="" \
  ONLY_ACTIVE_ARCH=NO \
  CLANG_CXX_LANGUAGE_STANDARD=c++17 \
  CLANG_CXX_LIBRARY=libc++ \
  clean build

if [ $? -eq 0 ]; then
    echo "✅ Build succeeded!"
    echo "📱 App location: ios/build/Build/Products/Debug-iphonesimulator/TempGlicoTrack.app"
else
    echo "❌ Build failed with exit code $?"
    echo "💡 Check the output above for specific error messages"
fi