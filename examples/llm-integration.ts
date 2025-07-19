/**
 * LLM Integration Example
 * Demonstrates how to use the LLM adapter with Vegapunk agents
 */

import { AtlasAgent } from '../src/agents/atlas/AtlasAgent';
import { EdisonAgent } from '../src/agents/edison/EdisonAgent';
import { EnhancedLLMProviderFactory } from '../src/utils/llm/EnhancedLLMProvider';
import { OllamaUtils } from '../src/integrations/LLMAdapter';
import { logger } from '../src/utils/logger';

async function main() {
  console.log('=== Vegapunk LLM Integration Example ===\n');

  // Step 1: Check if Ollama is running
  console.log('1. Checking Ollama availability...');
  const isOllamaRunning = await OllamaUtils.isRunning();
  
  if (!isOllamaRunning) {
    console.error('❌ Ollama is not running!');
    console.log('Please start Ollama with: ollama serve');
    process.exit(1);
  }
  
  console.log('✅ Ollama is running\n');

  // Step 2: Auto-detect available LLM provider
  console.log('2. Auto-detecting LLM provider...');
  const autoProvider = await EnhancedLLMProviderFactory.detectAvailableProvider();
  
  if (!autoProvider) {
    console.error('❌ No LLM provider available');
    process.exit(1);
  }
  
  console.log(`✅ Using ${autoProvider.getProviderName()} with model ${autoProvider.getModelName()}\n`);

  // Step 3: Create provider with auto-pull
  console.log('3. Creating Ollama provider with auto-pull...');
  const llmProvider = await EnhancedLLMProviderFactory.createWithAutoPull({
    provider: 'ollama',
    model: 'mistral', // Change this to your preferred model
    temperature: 0.7,
    maxTokens: 2000,
  });
  
  console.log('✅ LLM provider ready\n');

  // Step 4: Test basic generation
  console.log('4. Testing basic generation...');
  const testResponse = await llmProvider.generate({
    prompt: 'What is the Vegapunk multi-agent system?',
    systemPrompt: 'You are a helpful AI assistant.',
  });
  
  console.log('Response:', testResponse.content.substring(0, 200) + '...');
  console.log(`Tokens used: ${testResponse.usage?.totalTokens || 'N/A'}\n`);

  // Step 5: Create Atlas agent with Ollama
  console.log('5. Creating Atlas agent with Ollama...');
  const atlasAgent = new AtlasAgent({
    id: 'atlas-001',
    name: 'Atlas Security Monitor',
    capabilities: ['security_monitoring', 'threat_detection', 'incident_response'],
    llmProvider,
    memory: {
      shortTerm: { maxItems: 100 },
      longTerm: { maxItems: 1000 },
      episodic: { maxItems: 50 },
    },
  });
  
  console.log('✅ Atlas agent created\n');

  // Step 6: Test Atlas agent capabilities
  console.log('6. Testing Atlas agent security analysis...');
  const securityAnalysis = await atlasAgent.think({
    context: {
      task: 'analyze_security',
      data: {
        events: [
          { type: 'failed_login', count: 5, ip: '192.168.1.100' },
          { type: 'port_scan', ports: [22, 80, 443], ip: '10.0.0.50' },
        ],
      },
    },
  });
  
  console.log('Atlas analysis:', securityAnalysis.analysis?.substring(0, 300) + '...');
  console.log(`Confidence: ${securityAnalysis.confidence}\n`);

  // Step 7: Create Edison agent for comparison
  console.log('7. Creating Edison agent with same LLM...');
  const edisonAgent = new EdisonAgent({
    id: 'edison-001',
    name: 'Edison Innovation Engine',
    capabilities: ['problem_solving', 'innovation', 'logical_reasoning'],
    llmProvider,
    memory: {
      shortTerm: { maxItems: 100 },
      longTerm: { maxItems: 1000 },
      episodic: { maxItems: 50 },
    },
  });
  
  console.log('✅ Edison agent created\n');

  // Step 8: Test Edison agent problem solving
  console.log('8. Testing Edison agent problem solving...');
  const problemSolution = await edisonAgent.think({
    context: {
      task: 'solve_problem',
      data: {
        problem: 'How can we improve agent collaboration efficiency by 50%?',
        constraints: ['limited compute resources', 'real-time requirements'],
      },
    },
  });
  
  console.log('Edison solution:', problemSolution.analysis?.substring(0, 300) + '...');
  console.log(`Innovation score: ${problemSolution.confidence}\n`);

  // Step 9: Test streaming capability
  console.log('9. Testing streaming response...');
  console.log('Atlas streaming analysis:\n');
  
  if ('streamCompletion' in llmProvider) {
    await (llmProvider as any).streamCompletion(
      {
        prompt: 'Analyze the security implications of multi-agent AI systems.',
        systemPrompt: 'You are Atlas, a security specialist agent. Provide a concise security analysis.',
      },
      (chunk: string) => {
        process.stdout.write(chunk);
      }
    );
    console.log('\n');
  }

  // Step 10: Show model recommendations
  console.log('\n10. Recommended Ollama models for Vegapunk:');
  const recommendations = OllamaUtils.getRecommendedModels();
  recommendations.forEach(model => {
    console.log(`  • ${model.name} (${model.size}): ${model.description}`);
  });

  // Step 11: Create custom Modelfile
  console.log('\n11. Example custom Modelfile for Atlas:');
  const atlasModelfile = OllamaUtils.createVegapunkModelfile('mistral', 'atlas');
  console.log(atlasModelfile);

  console.log('\n=== Example completed successfully! ===');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run the example
main().catch(error => {
  console.error('Example failed:', error);
  process.exit(1);
});