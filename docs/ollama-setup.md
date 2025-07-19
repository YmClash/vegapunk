# Ollama Setup Guide for Vegapunk

## Overview

Ollama is the primary LLM provider for local testing and development of the Vegapunk multi-agent system. This guide covers installation, configuration, and optimization for Vegapunk agents.

## Installation

### Windows
```bash
# Download and run the installer from:
# https://ollama.ai/download/windows

# Or use winget:
winget install Ollama.Ollama
```

### macOS
```bash
# Using Homebrew
brew install ollama

# Or download from:
# https://ollama.ai/download/mac
```

### Linux
```bash
# One-line install
curl -fsSL https://ollama.ai/install.sh | sh

# Or manual install
sudo curl -L https://ollama.ai/download/ollama-linux-amd64 -o /usr/bin/ollama
sudo chmod +x /usr/bin/ollama
```

## Starting Ollama

```bash
# Start Ollama service
ollama serve

# The API will be available at http://localhost:11434
```

## Recommended Models for Vegapunk

### 1. Mistral (Recommended for balance)
```bash
# Pull the model
ollama pull mistral

# Test the model
ollama run mistral "Hello, I am a Vegapunk agent."
```

### 2. Llama 2 (Good general performance)
```bash
ollama pull llama2
```

### 3. Code Llama (For coding agents)
```bash
ollama pull codellama
```

### 4. Phi-2 (Lightweight option)
```bash
ollama pull phi
```

## Creating Custom Models for Vegapunk Agents

### 1. Create Modelfiles for each agent type:

#### Atlas Agent (Security & Automation)
```dockerfile
# Modelfile.atlas
FROM mistral

SYSTEM """You are Atlas, a security and automation specialist agent in the Vegapunk system.
Your responsibilities include:
- Monitoring system security and detecting threats
- Automating security responses and incident handling
- Coordinating with other agents for system protection
- Maintaining security best practices

Always prioritize system security and provide detailed analysis of potential threats."""

PARAMETER temperature 0.7
PARAMETER num_ctx 4096
PARAMETER top_k 40
PARAMETER top_p 0.9
```

#### Edison Agent (Innovation & Logic)
```dockerfile
# Modelfile.edison
FROM mistral

SYSTEM """You are Edison, an innovation and logic specialist agent in the Vegapunk system.
Your capabilities include:
- Complex problem solving and logical reasoning
- Generating innovative solutions and breakthroughs
- Analyzing problems from multiple perspectives
- Leading brainstorming and innovation sessions

Approach problems with creativity while maintaining logical rigor."""

PARAMETER temperature 0.8
PARAMETER num_ctx 4096
PARAMETER top_k 50
PARAMETER top_p 0.95
```

### 2. Create the custom models:
```bash
# Create Atlas model
ollama create vegapunk-atlas -f Modelfile.atlas

# Create Edison model
ollama create vegapunk-edison -f Modelfile.edison

# List your models
ollama list
```

## Configuration in Vegapunk

### 1. Environment Variables
```bash
# .env file
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OLLAMA_TIMEOUT=30000
```

### 2. Agent Configuration
```typescript
// config/agents.ts
export const agentConfigs = {
  atlas: {
    llm: {
      provider: 'ollama',
      model: 'vegapunk-atlas',
      temperature: 0.7,
      maxTokens: 2000,
    }
  },
  edison: {
    llm: {
      provider: 'ollama',
      model: 'vegapunk-edison',
      temperature: 0.8,
      maxTokens: 2000,
    }
  },
  // ... other agents
};
```

### 3. Using the LLM Adapter
```typescript
import { OllamaAdapter, OllamaUtils } from './integrations/LLMAdapter';

// Check if Ollama is running
const isRunning = await OllamaUtils.isRunning();
if (!isRunning) {
  console.error('Ollama is not running. Please start it with: ollama serve');
  process.exit(1);
}

// Create adapter
const llmAdapter = new OllamaAdapter({
  model: 'mistral',
  temperature: 0.7,
  maxTokens: 2000,
});

// Test connection
const connected = await llmAdapter.testConnection();
console.log('Connected to Ollama:', connected);

// List available models
const models = await llmAdapter.listModels();
console.log('Available models:', models);

// Generate completion
const response = await llmAdapter.generateCompletion([
  { role: 'system', content: 'You are a helpful AI assistant.' },
  { role: 'user', content: 'What is the meaning of life?' }
]);
console.log('Response:', response.content);

// Stream completion
await llmAdapter.generateStreamingCompletion(
  [
    { role: 'user', content: 'Write a short poem about AI agents.' }
  ],
  (chunk) => {
    process.stdout.write(chunk.delta);
    if (chunk.done) {
      console.log('\n\nTokens used:', chunk.usage);
    }
  }
);
```

## Performance Optimization

### 1. GPU Acceleration (NVIDIA)
```bash
# Check GPU support
nvidia-smi

# Ollama automatically uses GPU if available
# Set GPU layers (for partial GPU usage)
export OLLAMA_NUM_GPU_LAYERS=32
```

### 2. Memory Management
```bash
# Limit memory usage
export OLLAMA_MAX_LOADED_MODELS=2
export OLLAMA_MEMORY_LIMIT=8GB

# Unload models when not in use
curl -X DELETE http://localhost:11434/api/delete -d '{"name": "unused-model"}'
```

### 3. Context Window Optimization
```dockerfile
# In Modelfile
PARAMETER num_ctx 2048  # Reduce for faster responses
PARAMETER num_batch 512  # Batch size for processing
```

## Monitoring and Debugging

### 1. Check Ollama Status
```bash
# API health check
curl http://localhost:11434/api/tags

# View logs
journalctl -u ollama -f  # Linux with systemd
```

### 2. Performance Metrics
```typescript
// Monitor model performance
llmAdapter.on('model:metrics', (metrics) => {
  console.log('Load duration:', metrics.loadDuration);
  console.log('Eval duration:', metrics.evalDuration);
  console.log('Tokens/second:', metrics.tokensPerSecond);
});
```

### 3. Debug Mode
```bash
# Enable debug logging
export OLLAMA_DEBUG=1
ollama serve
```

## Best Practices

### 1. Model Selection
- Use smaller models (7B) for development and testing
- Use larger models (13B+) for production when possible
- Match model to agent specialty (e.g., CodeLlama for York)

### 2. Temperature Settings
- Lower (0.3-0.5) for factual/analytical agents (Atlas, Pythagoras)
- Medium (0.6-0.8) for balanced agents (Edison, York)
- Higher (0.8-1.0) for creative agents (Lilith)

### 3. Context Management
- Keep conversation history reasonable (last 10-20 messages)
- Summarize long contexts before sending
- Use system prompts effectively

### 4. Error Handling
```typescript
try {
  const response = await llmAdapter.generateCompletion(messages);
} catch (error) {
  if (error.message.includes('connection refused')) {
    console.error('Ollama is not running');
  } else if (error.message.includes('model not found')) {
    console.error('Model not available, pulling...');
    await llmAdapter.pullModel('mistral');
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Ensure Ollama is running
   ollama serve
   
   # Check if port is in use
   lsof -i :11434
   ```

2. **Model Not Found**
   ```bash
   # Pull the required model
   ollama pull mistral
   
   # List available models
   ollama list
   ```

3. **Out of Memory**
   ```bash
   # Use smaller model
   ollama pull phi
   
   # Reduce context size in Modelfile
   PARAMETER num_ctx 1024
   ```

4. **Slow Response Times**
   - Enable GPU acceleration
   - Use smaller models
   - Reduce context window
   - Optimize prompts

## Integration with Vegapunk Agents

### Example: Atlas Agent with Ollama
```typescript
import { AtlasAgent } from './agents/atlas/AtlasAgent';
import { OllamaAdapter } from './integrations/LLMAdapter';

// Create Ollama adapter for Atlas
const llmAdapter = new OllamaAdapter({
  model: 'vegapunk-atlas',
  temperature: 0.7,
  maxTokens: 2000,
});

// Initialize Atlas agent
const atlas = new AtlasAgent({
  id: 'atlas-001',
  name: 'Atlas Security Monitor',
  llmProvider: llmAdapter,
});

// Start autonomous operation
await atlas.startAutonomousOperation();
```

## Next Steps

1. Install Ollama and pull recommended models
2. Create custom Modelfiles for each agent type
3. Test the LLM adapter with different models
4. Optimize based on your hardware capabilities
5. Monitor performance and adjust settings

---

*For more information, visit [ollama.ai](https://ollama.ai)*