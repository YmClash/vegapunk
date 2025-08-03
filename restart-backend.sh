#!/bin/bash

echo "🔄 Restarting Vegapunk Backend..."

# Kill any existing backend process
echo "⏹️  Stopping existing backend..."
pkill -f "ts-node src/index.ts" 2>/dev/null || true
pkill -f "node dist/index.js" 2>/dev/null || true

# Clean and rebuild
echo "🧹 Cleaning dist folder..."
rm -rf dist/

echo "🔨 Compiling TypeScript..."
npx tsc

echo "✅ Starting backend server..."
npx ts-node src/index.ts &

echo "⏳ Waiting for server to start..."
sleep 5

# Test if server is running
curl -s http://localhost:8080/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend server is running!"
    echo "🌐 API: http://localhost:8080"
    echo "📊 Dashboard: http://localhost:5173"
else
    echo "❌ Failed to start backend server"
fi