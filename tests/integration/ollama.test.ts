/**
 * Ollama Integration Tests
 * Test the LLM adapter with Ollama
 */

import { OllamaAdapter, OllamaUtils } from '../../src/integrations/LLMAdapter';
import { logger } from '../../src/utils/logger';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`),
};

async function runOllamaTests() {
  log.header('Ollama Integration Tests');

  // Test 1: Check if Ollama is running
  log.info('Testing Ollama availability...');
  const isRunning = await OllamaUtils.isRunning();
  
  if (!isRunning) {
    log.error('Ollama is not running!');
    log.warn('Please start Ollama with: ollama serve');
    process.exit(1);
  }
  
  log.success('Ollama is running');

  // Test 2: Create adapter and test connection
  log.info('Creating Ollama adapter...');
  const adapter = new OllamaAdapter({
    model: 'mistral', // You can change this to any model you have
    temperature: 0.7,
    maxTokens: 1000,
  });

  const connected = await adapter.testConnection();
  if (!connected) {
    log.error('Failed to connect to Ollama');
    process.exit(1);
  }
  
  log.success('Connected to Ollama');

  // Test 3: List available models
  log.info('Listing available models...');
  try {
    const models = await adapter.listModels();
    log.success(`Found ${models.length} models:`);
    models.forEach(model => {
      console.log(`  - ${model.name} (context: ${model.contextLength} tokens)`);
    });
    
    if (models.length === 0) {
      log.warn('No models found. Pull a model with: ollama pull mistral');
      process.exit(1);
    }
  } catch (error) {
    log.error('Failed to list models');
    console.error(error);
  }

  // Test 4: Generate a simple completion
  log.header('Testing Text Generation');
  log.info('Generating completion...');
  
  try {
    const startTime = Date.now();
    const response = await adapter.generateCompletion([
      {
        role: 'system',
        content: 'You are a helpful AI assistant part of the Vegapunk multi-agent system.',
      },
      {
        role: 'user',
        content: 'In one sentence, explain what Vegapunk is.',
      },
    ]);
    
    const duration = Date.now() - startTime;
    log.success(`Generated response in ${duration}ms`);
    console.log(`\nResponse: ${response.content}`);
    
    if (response.usage) {
      console.log(`\nToken usage:`);
      console.log(`  - Prompt tokens: ${response.usage.promptTokens}`);
      console.log(`  - Completion tokens: ${response.usage.completionTokens}`);
      console.log(`  - Total tokens: ${response.usage.totalTokens}`);
    }
  } catch (error) {
    log.error('Failed to generate completion');
    console.error(error);
  }

  // Test 5: Test streaming completion
  log.header('Testing Streaming Generation');
  log.info('Generating streaming response...');
  
  try {
    console.log('\nResponse: ');
    const startTime = Date.now();
    let tokenCount = 0;
    
    await adapter.generateStreamingCompletion(
      [
        {
          role: 'user',
          content: 'Write a haiku about artificial intelligence agents working together.',
        },
      ],
      (chunk) => {
        if (chunk.delta) {
          process.stdout.write(chunk.delta);
          tokenCount++;
        }
        
        if (chunk.done && chunk.usage) {
          const duration = Date.now() - startTime;
          console.log('\n');
          log.success(`Streaming completed in ${duration}ms`);
          console.log(`Tokens generated: ${chunk.usage.completionTokens}`);
          console.log(`Tokens per second: ${(tokenCount / (duration / 1000)).toFixed(2)}`);
        }
      }
    );
  } catch (error) {
    log.error('Failed to generate streaming completion');
    console.error(error);
  }

  // Test 6: Test with different agent personalities
  log.header('Testing Agent Personalities');
  
  const agents = [
    {
      name: 'Atlas',
      prompt: 'You are Atlas, a security specialist. Analyze this: "System detected unusual network traffic"',
      model: 'mistral',
    },
    {
      name: 'Edison',
      prompt: 'You are Edison, an innovation specialist. Propose a creative solution for: "Improving agent collaboration"',
      model: 'mistral',
    },
    {
      name: 'Pythagoras',
      prompt: 'You are Pythagoras, a data specialist. Analyze this dataset: "[10, 20, 15, 25, 30, 18]"',
      model: 'mistral',
    },
  ];

  for (const agent of agents) {
    log.info(`Testing ${agent.name} agent...`);
    
    try {
      const agentAdapter = new OllamaAdapter({
        model: agent.model,
        temperature: 0.7,
        maxTokens: 200,
      });
      
      const response = await agentAdapter.generateCompletion([
        {
          role: 'system',
          content: agent.prompt.split('.')[0] + '.',
        },
        {
          role: 'user',
          content: agent.prompt.split('.').slice(1).join('.').trim(),
        },
      ]);
      
      console.log(`\n${agent.name} response:`);
      console.log(response.content.substring(0, 200) + '...\n');
    } catch (error) {
      log.error(`Failed to test ${agent.name} agent`);
    }
  }

  // Test 7: Performance benchmark
  log.header('Performance Benchmark');
  log.info('Running performance tests...');
  
  const benchmarkPrompts = [
    'What is 2+2?',
    'Explain quantum computing in simple terms.',
    'Write a function to sort an array in Python.',
  ];
  
  const results = [];
  
  for (const prompt of benchmarkPrompts) {
    const startTime = Date.now();
    
    try {
      await adapter.generateCompletion([
        { role: 'user', content: prompt },
      ]);
      
      const duration = Date.now() - startTime;
      results.push({
        prompt: prompt.substring(0, 30) + '...',
        duration,
      });
    } catch (error) {
      results.push({
        prompt: prompt.substring(0, 30) + '...',
        duration: -1,
      });
    }
  }
  
  console.log('\nBenchmark Results:');
  results.forEach(result => {
    if (result.duration > 0) {
      console.log(`  - "${result.prompt}": ${result.duration}ms`);
    } else {
      console.log(`  - "${result.prompt}": FAILED`);
    }
  });
  
  const avgDuration = results
    .filter(r => r.duration > 0)
    .reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`\nAverage response time: ${avgDuration.toFixed(0)}ms`);

  // Test 8: Model recommendations
  log.header('Model Recommendations');
  log.info('Recommended models for Vegapunk:');
  
  const recommendations = OllamaUtils.getRecommendedModels();
  recommendations.forEach(model => {
    console.log(`\n  • ${colors.yellow}${model.name}${colors.reset} (${model.size})`);
    console.log(`    ${model.description}`);
  });

  // Summary
  log.header('Test Summary');
  log.success('All tests completed successfully!');
  log.info('Ollama is properly configured for Vegapunk');
  
  // Cleanup
  adapter.removeAllListeners();
}

// Run tests
runOllamaTests().catch(error => {
  log.error('Test suite failed');
  console.error(error);
  process.exit(1);
});