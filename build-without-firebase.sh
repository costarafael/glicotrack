#!/bin/bash

# Emergency build script without Firebase dependencies
# Use this if leveldb-library continues to fail

echo "🚑 Emergency Build: Temporarily Disabling Firebase"
echo "================================================="

# Backup current package.json
cp package.json package.json.backup

# Remove Firebase dependencies from package.json
echo "📦 Temporarily removing Firebase dependencies..."
sed -i.bak '/firebase/d' package.json

# Backup and modify Podfile  
cp ios/Podfile ios/Podfile.backup

# Create simplified Podfile without Firebase static frameworks
cat > ios/Podfile.temp << 'EOF'
require_relative '../node_modules/react-native/scripts/react_native_pods'

platform :ios, min_ios_version_supported
prepare_react_native_project!

target 'TempGlicoTrack' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
    
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.4'
        config.build_settings['ENABLE_BITCODE'] = 'NO'
        config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
  end
end
EOF

mv ios/Podfile.temp ios/Podfile

echo "🧹 Cleaning and rebuilding without Firebase..."
cd ios
rm -rf Pods Podfile.lock build
pod install

echo "🔨 Building without Firebase..."
xcodebuild \
  -workspace GlicoTrack.xcworkspace \
  -scheme GlicoTrack \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  clean build

if [ $? -eq 0 ]; then
    echo "✅ Build without Firebase succeeded!"
    echo "📝 This confirms the issue is with Firebase/leveldb"
    echo "💡 Consider updating Firebase version or using alternative"
else
    echo "❌ Build failed even without Firebase"
    echo "🔍 There may be other issues beyond Firebase"
fi

echo "🔄 Restoring original configuration..."
cd ..
mv package.json.backup package.json
mv ios/Podfile.backup ios/Podfile

echo "📋 Emergency build complete. Check results above."