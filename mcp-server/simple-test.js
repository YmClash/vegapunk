#!/usr/bin/env node
/**
 * Simple test to verify MCP server is working
 */

import { spawn } from 'child_process';

async function simpleTest() {
  console.error('🧪 Simple MCP Server Test\n');

  // Start the server
  const server = spawn('node', ['vegapunk-mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Capture server logs
  server.stderr.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });

  // Send a simple tools/list request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  console.error('📤 Sending tools/list request...');
  server.stdin.write(JSON.stringify(request) + '\n');

  // Wait for response
  server.stdout.on('data', (data) => {
    try {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        const response = JSON.parse(line);
        console.error('\n📥 Received response:');
        console.error(JSON.stringify(response, null, 2));
        
        if (response.result && response.result.tools) {
          console.error(`\n✅ Found ${response.result.tools.length} tools!`);
          response.result.tools.forEach(tool => {
            console.error(`  - ${tool.name}`);
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
    }
  });

  // Wait a bit then close
  setTimeout(() => {
    console.error('\n🏁 Test complete!');
    server.kill();
    process.exit(0);
  }, 2000);
}

simpleTest().catch(console.error);