#!/bin/bash

# Script to backup the GlicoTrack project, excluding heavy files and folders like node_modules, build directories, APKs, etc.

# Define the backup name with timestamp to avoid overwriting
BACKUP_NAME="GlicoTrack_backup_$(date +%Y-%m-%d_%H-%M-%S).zip"

# Path to save the backup (one level above the current directory)
BACKUP_PATH="../$BACKUP_NAME"

# List of patterns to exclude
EXCLUDES=(
    "node_modules/*"
    "android/build/*" # Exclude the top-level Android build folder
    "android/app/build/intermediates/*"
    "android/app/build/outputs/*"
    "android/app/build/tmp/*"
    "android/app/build/generated/ap_generated_sources/*"
    "android/app/build/generated/assets/*"
    "android/app/build/generated/res/*"
    "android/app/build/generated/sourcemaps/*"
    "**/.cxx/*"           # Exclude C++ build files
    "vendor/*"            # Exclude vendor dependencies
    "dist/*"
    ".git/*"
    "*.apk"
    "*.log"
    "android/.gradle/*"
    "ios/Pods/*"
    "ios/build/*"
    "*.swp"
    "*.tar.gz"
    "*.zip"
    "GlicoTrack_backup_*.zip" # Exclude old backup directories
)

# Build the exclusion arguments for the zip command
EXCLUDE_ARGS=()
for pattern in "${EXCLUDES[@]}"; do
    EXCLUDE_ARGS+=(-x "$pattern")
done

# Create the zip archive of the current directory, excluding the specified patterns
zip -r "$BACKUP_PATH" . "${EXCLUDE_ARGS[@]}"

# Output confirmation
echo "Backup created successfully at $BACKUP_PATH"