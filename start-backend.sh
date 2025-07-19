#!/bin/bash

echo "🚀 Starting Vegapunk Backend..."
echo "Setting environment variables..."

export NODE_ENV=development
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=llama2
export PORT=8080

echo "✅ Environment configured"
echo "Starting server with transpileOnly mode..."

# Start with transpileOnly to ignore TypeScript errors in agent files
npx ts-node -T -r tsconfig-paths/register ./src/index.ts