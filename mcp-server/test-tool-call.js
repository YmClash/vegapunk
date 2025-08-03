#!/usr/bin/env node
/**
 * Test tool calling
 */

import { spawn } from 'child_process';

async function testToolCall() {
  console.error('🧪 Testing Tool Call\n');

  const server = spawn('node', ['vegapunk-mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  server.stderr.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test vegapunk_chat tool
  const chatRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'vegapunk_chat',
      arguments: {
        message: 'What are the ethical implications of AI in healthcare?',
        context: 'Testing MCP integration'
      }
    }
  };

  console.error('📤 Calling vegapunk_chat tool...');
  server.stdin.write(JSON.stringify(chatRequest) + '\n');

  server.stdout.on('data', (data) => {
    try {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        const response = JSON.parse(line);
        if (response.id === 2) {
          console.error('\n📥 Chat Response:');
          if (response.result && response.result.content) {
            const content = JSON.parse(response.result.content[0].text);
            console.error(`Message: ${content.message}`);
            console.error(`Agent: ${content.agent}`);
            console.error(`Ethical Score: ${content.ethicalScore}`);
            console.error(`Confidence: ${content.confidence}`);
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  });

  // Test network analysis after 1 second
  setTimeout(async () => {
    const networkRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'analyze_agent_network',
        arguments: {
          includeMetrics: true
        }
      }
    };

    console.error('\n📤 Calling analyze_agent_network tool...');
    server.stdin.write(JSON.stringify(networkRequest) + '\n');
  }, 1000);

  // Close after 3 seconds
  setTimeout(() => {
    console.error('\n✅ All tests completed!');
    server.kill();
    process.exit(0);
  }, 3000);
}

testToolCall().catch(console.error);