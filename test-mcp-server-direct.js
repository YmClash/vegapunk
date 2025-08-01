#!/usr/bin/env node
// Test direct du serveur MCP

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing MCP Server directly...\n');

// Lance le serveur MCP
const serverPath = path.join(__dirname, 'mcp-server', 'vegapunk-mcp-server.js');
const mcpProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Capture les logs
mcpProcess.stderr.on('data', (data) => {
  console.log('Server log:', data.toString().trim());
});

// Envoi d'une requête de test
setTimeout(() => {
  console.log('\n📤 Sending list tools request...');
  const request = {
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  };
  
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

// Capture la réponse
mcpProcess.stdout.on('data', (data) => {
  console.log('\n📥 Response:', data.toString().trim());
  
  // Test d'appel d'outil après 2 secondes
  setTimeout(() => {
    console.log('\n📤 Calling vegapunk_chat tool...');
    const toolCall = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'vegapunk_chat',
        arguments: {
          message: 'Hello from direct test!',
          context: 'Testing MCP server'
        }
      },
      id: 2
    };
    
    mcpProcess.stdin.write(JSON.stringify(toolCall) + '\n');
  }, 2000);
});

// Arrêt après 10 secondes
setTimeout(() => {
  console.log('\n🛑 Stopping test...');
  mcpProcess.kill();
  process.exit(0);
}, 10000);