#!/bin/bash

echo "🚀 Vegapunk Environment Setup"
echo "============================="

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
    echo "📋 Current environment variables:"
    echo ""
    
    # Show current env vars (without sensitive values)
    echo "OLLAMA_BASE_URL: ${OLLAMA_BASE_URL:-'Not set'}"
    echo "OLLAMA_MODEL: ${OLLAMA_MODEL:-'Not set'}"
    echo "HUGGING_FACE_MODEL: ${HUGGING_FACE_MODEL:-'Not set'}"
    echo "HUGGING_FACE_API_KEY: ${HUGGING_FACE_API_KEY:+Set (hidden)}${HUGGING_FACE_API_KEY:-'Not set'}"
    echo "PORT: ${PORT:-'Not set'}"
    echo ""
    
    read -p "Do you want to edit the .env file? (y/n): " edit_env
    if [ "$edit_env" = "y" ] || [ "$edit_env" = "Y" ]; then
        ${EDITOR:-nano} .env
    fi
else
    echo "📁 .env file not found"
    echo "📋 Creating from .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from template"
        echo ""
        echo "🔧 Please edit .env file to add your configuration:"
        echo "   - HUGGING_FACE_API_KEY: Get from https://huggingface.co/settings/tokens"
        echo "   - Other API keys if needed"
        echo ""
        
        read -p "Do you want to edit the .env file now? (y/n): " edit_now
        if [ "$edit_now" = "y" ] || [ "$edit_now" = "Y" ]; then
            ${EDITOR:-nano} .env
        fi
    else
        echo "❌ .env.example not found"
        echo "💡 Please create .env manually or run this script from the project root"
        exit 1
    fi
fi

echo ""
echo "🔍 Verifying setup..."

# Check if dotenv is available in Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js is available"
    
    # Test loading .env
    if [ -f ".env" ]; then
        echo "🧪 Testing environment loading..."
        node -e "
        require('dotenv').config();
        console.log('✅ Environment variables loaded successfully');
        console.log('📊 Configured providers:');
        console.log('   - Ollama:', process.env.OLLAMA_BASE_URL ? '✅' : '❌');
        console.log('   - Hugging Face:', process.env.HUGGING_FACE_API_KEY ? '✅' : '❌');
        " 2>/dev/null || echo "⚠️  Could not test environment loading (dotenv may not be installed)"
    fi
else
    echo "⚠️  Node.js not found in PATH"
fi

echo ""
echo "📚 Quick Reference:"
echo "  🔑 Add Hugging Face API key: HUGGING_FACE_API_KEY=hf_your_token_here"
echo "  🤖 Change Ollama model: OLLAMA_MODEL=model_name"
echo "  🌐 Change server port: PORT=8080"
echo ""
echo "🚀 To start the application:"
echo "   npm run start:dashboard"
echo "   # or with specific env:"
echo "   HUGGING_FACE_API_KEY=your_key npm run start:dashboard"
echo ""
echo "✅ Setup complete!"