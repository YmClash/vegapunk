#!/usr/bin/env node
/**
 * Test script for Vegapunk MCP Server
 * Tests all tools and resources before adding to Claude Desktop
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testServer() {
  console.error('🧪 Testing Vegapunk MCP Server...\n');

  try {
    // Start the server process
    const serverProcess = spawn('node', ['vegapunk-mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Capture stderr from server for debugging
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Log] ${data.toString().trim()}`);
    });

    // Create client transport
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['vegapunk-mcp-server.js'],
    });

    // Create and connect client
    const client = new Client(
      {
        name: 'vegapunk-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    console.error('✅ Connected to server\n');

    // Test 1: List Tools
    console.error('📋 Available Tools:');
    const toolsResponse = await client.request(
      { method: 'tools/list' },
      { timeout: 5000 }
    );
    console.error('Tools found:', toolsResponse.tools.length);
    toolsResponse.tools.forEach(tool => {
      console.error(`  - ${tool.name}: ${tool.description}`);
    });
    console.error('');

    // Test 2: Call Tools
    console.error('🔧 Testing Tools:\n');

    // Test vegapunk_chat
    console.error('1. Testing vegapunk_chat...');
    try {
      const chatResponse = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'vegapunk_chat',
            arguments: {
              message: 'What are the key principles of ethical AI development?',
              context: 'Testing MCP integration'
            }
          }
        },
        { timeout: 5000 }
      );
      console.error('✅ Chat response received:');
      console.error(JSON.parse(chatResponse.content[0].text).message);
    } catch (error) {
      console.error('❌ Chat tool error:', error.message);
    }
    console.error('');

    // Test analyze_agent_network
    console.error('2. Testing analyze_agent_network...');
    try {
      const networkResponse = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'analyze_agent_network',
            arguments: {
              includeMetrics: true
            }
          }
        },
        { timeout: 5000 }
      );
      const networkData = JSON.parse(networkResponse.content[0].text);
      console.error('✅ Network analysis:');
      console.error(`  - Status: ${networkData.status}`);
      console.error(`  - Active agents: ${networkData.activeAgents.filter(a => a.status === 'online').length}/${networkData.totalAgents}`);
      console.error(`  - A2A Protocol: ${networkData.protocols.a2a.status}`);
    } catch (error) {
      console.error('❌ Network analysis error:', error.message);
    }
    console.error('');

    // Test execute_workflow
    console.error('3. Testing execute_workflow...');
    try {
      const workflowResponse = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'execute_workflow',
            arguments: {
              workflow: 'ethical-review',
              input: 'Automated decision-making in healthcare AI systems'
            }
          }
        },
        { timeout: 5000 }
      );
      const workflowData = JSON.parse(workflowResponse.content[0].text);
      console.error('✅ Workflow execution:');
      console.error(`  - Workflow: ${workflowData.workflow}`);
      console.error(`  - Status: ${workflowData.execution.status}`);
      console.error(`  - Duration: ${workflowData.execution.duration}ms`);
    } catch (error) {
      console.error('❌ Workflow execution error:', error.message);
    }
    console.error('');

    // Test 3: List Resources
    console.error('📚 Available Resources:');
    const resourcesResponse = await client.request(
      { method: 'resources/list' },
      { timeout: 5000 }
    );
    console.error('Resources found:', resourcesResponse.resources.length);
    resourcesResponse.resources.forEach(resource => {
      console.error(`  - ${resource.uri}: ${resource.name}`);
    });
    console.error('');

    // Test 4: Read Resources
    console.error('📖 Testing Resource Access:\n');
    
    for (const resource of resourcesResponse.resources) {
      console.error(`Reading ${resource.name}...`);
      try {
        const resourceContent = await client.request(
          {
            method: 'resources/read',
            params: { uri: resource.uri }
          },
          { timeout: 5000 }
        );
        console.error(`✅ Successfully read ${resource.uri}`);
        console.error(`  Content preview: ${resourceContent.contents[0].text.substring(0, 100)}...`);
      } catch (error) {
        console.error(`❌ Error reading ${resource.uri}:`, error.message);
      }
      console.error('');
    }

    // Close connection
    await client.close();
    serverProcess.kill();

    console.error('\n✅ All tests completed!');
    console.error('\n📝 Next steps:');
    console.error('1. If all tests passed, the server is ready for Claude Desktop');
    console.error('2. Follow the instructions in README.md to add to Claude Desktop');
    console.error('3. Restart Claude Desktop after adding the configuration');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you ran: npm install');
    console.error('2. Check Node.js version: node --version (needs v18+)');
    console.error('3. Verify the server file exists and has correct permissions');
    process.exit(1);
  }
}

// Run the test
testServer().catch(console.error);