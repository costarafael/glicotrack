#!/bin/bash

# Debug script for leveldb-library header issues
echo "🔍 Debugging leveldb-library header structure"
echo "============================================="

cd ios

# Check if Pods directory exists
if [ ! -d "Pods" ]; then
    echo "❌ Pods directory not found. Run pod install first."
    exit 1
fi

# Check if leveldb-library exists
if [ ! -d "Pods/leveldb-library" ]; then
    echo "❌ leveldb-library pod not found in Pods/"
    echo "📋 Available pods:"
    ls -la Pods/ | grep -E "^d" | head -10
    exit 1
fi

echo "✅ leveldb-library pod found"
echo "📁 leveldb-library directory structure:"
find Pods/leveldb-library -type f -name "*.h" | head -20

echo ""
echo "🔍 Checking specific header files that are failing:"

# Check for version_set.h
if [ -f "Pods/leveldb-library/db/version_set.h" ]; then
    echo "✅ db/version_set.h exists"
else
    echo "❌ db/version_set.h NOT found"
    echo "📋 Contents of db/ directory:"
    ls -la Pods/leveldb-library/db/ 2>/dev/null || echo "db/ directory not found"
fi

# Check for version_edit.h
if [ -f "Pods/leveldb-library/db/version_edit.h" ]; then
    echo "✅ db/version_edit.h exists"
else
    echo "❌ db/version_edit.h NOT found"
fi

echo ""
echo "📋 leveldb-library top-level contents:"
ls -la Pods/leveldb-library/

echo ""
echo "🔍 Searching for all version_*.h files:"
find Pods/leveldb-library -name "version_*.h" -type f

echo ""
echo "🔍 Checking include directory:"
if [ -d "Pods/leveldb-library/include" ]; then
    echo "✅ include/ directory exists"
    find Pods/leveldb-library/include -name "*.h" | head -10
else
    echo "❌ include/ directory not found"
fi

echo ""
echo "💡 If headers are missing, this indicates a leveldb pod installation issue"
echo "💡 If headers exist but in different locations, header paths need adjustment"