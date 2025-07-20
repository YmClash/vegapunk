#!/bin/bash

echo "🚀 Starting Vegapunk with Hugging Face Support"
echo "============================================="

# Check if HF API key is set
if [ -z "$HUGGING_FACE_API_KEY" ]; then
    echo "⚠️  Warning: HUGGING_FACE_API_KEY not set"
    echo "💡 To use Hugging Face, set your API key:"
    echo "   export HUGGING_FACE_API_KEY=\"your_token_here\""
    echo "   Get your token from: https://huggingface.co/settings/tokens"
    echo ""
    echo "🔄 Continuing with Ollama only..."
else
    echo "✅ HUGGING_FACE_API_KEY is set"
fi

# Set default Hugging Face model if not specified
if [ -z "$HUGGING_FACE_MODEL" ]; then
    export HUGGING_FACE_MODEL="microsoft/DialoGPT-medium"
    echo "📦 Using default Hugging Face model: $HUGGING_FACE_MODEL"
fi

echo ""
echo "🔧 Environment:"
echo "   HUGGING_FACE_MODEL: ${HUGGING_FACE_MODEL:-'not set'}"
echo "   OLLAMA_MODEL: ${OLLAMA_MODEL:-'qwen2:7b (default)'}"
echo ""

# Start the dashboard
echo "🚀 Starting dashboard server..."
npm run start:dashboard