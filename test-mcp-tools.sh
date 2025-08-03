#!/bin/bash

echo "🧪 Testing MCP Tools..."
echo ""

# Test vegapunk_chat
echo "1️⃣ Testing vegapunk_chat tool..."
curl -X POST http://localhost:8080/api/mcp/tools/test \
  -H "Content-Type: application/json" \
  -d '{
    "toolId": "vegapunk_chat",
    "parameters": {
      "message": "Hello Vegapunk, can you explain your multi-agent architecture?",
      "context": "Testing MCP integration"
    }
  }' | python3 -m json.tool

echo ""
echo "Press Enter to continue..."
read

# Test analyze_agent_network
echo "2️⃣ Testing analyze_agent_network tool..."
curl -X POST http://localhost:8080/api/mcp/tools/test \
  -H "Content-Type: application/json" \
  -d '{
    "toolId": "analyze_agent_network",
    "parameters": {
      "includeMetrics": true
    }
  }' | python3 -m json.tool

echo ""
echo "Press Enter to continue..."
read

# Test execute_workflow
echo "3️⃣ Testing execute_workflow tool..."
curl -X POST http://localhost:8080/api/mcp/tools/test \
  -H "Content-Type: application/json" \
  -d '{
    "toolId": "execute_workflow",
    "parameters": {
      "workflow": "ethical-review",
      "input": "Should AI systems have decision-making autonomy in critical situations?"
    }
  }' | python3 -m json.tool

echo ""
echo "✅ All tests completed!"