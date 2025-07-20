// Simple test script to verify Hugging Face integration
const axios = require('axios');

async function testHuggingFaceIntegration() {
  console.log('🧪 Testing Hugging Face Integration...\n');

  try {
    // 1. Test Health Endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:8080/api/health');
    console.log('✅ Health endpoint works');
    console.log('Available providers:', healthResponse.data.services.availableProviders);
    console.log('Current provider:', healthResponse.data.services.currentProvider);
    
    if (healthResponse.data.services.huggingface) {
      console.log('Hugging Face status:', healthResponse.data.services.huggingface.status);
      console.log('API Key configured:', healthResponse.data.services.huggingface.apiKeyConfigured);
    }
    console.log('');

    // 2. Test Provider Status
    console.log('2. Testing provider status endpoint...');
    const providerResponse = await axios.get('http://localhost:8080/api/providers/current');
    console.log('✅ Provider status endpoint works');
    console.log('Current provider:', providerResponse.data.currentProvider);
    console.log('Available providers:', providerResponse.data.availableProviders);
    console.log('');

    // 3. Test Provider Switch (if Hugging Face is available)
    if (providerResponse.data.availableProviders.includes('huggingface')) {
      console.log('3. Testing provider switch to Hugging Face...');
      try {
        const switchResponse = await axios.post('http://localhost:8080/api/providers/switch', {
          provider: 'huggingface'
        });
        console.log('✅ Successfully switched to Hugging Face');
        console.log('Current provider:', switchResponse.data.currentProvider);
        
        // Test chat with Hugging Face
        console.log('4. Testing chat with Hugging Face...');
        const chatResponse = await axios.post('http://localhost:8080/api/chat', {
          message: 'Hello! Can you tell me your name?'
        });
        console.log('✅ Chat with Hugging Face works');
        console.log('Response:', chatResponse.data.response);
        
        // Switch back to Ollama
        console.log('5. Switching back to Ollama...');
        await axios.post('http://localhost:8080/api/providers/switch', {
          provider: 'ollama'
        });
        console.log('✅ Switched back to Ollama');
        
      } catch (error) {
        console.log('❌ Hugging Face switch failed:', error.response?.data?.error || error.message);
        if (error.response?.data?.error?.includes('API key')) {
          console.log('💡 Tip: Set HUGGING_FACE_API_KEY environment variable');
        }
      }
    } else {
      console.log('3. ⚠️ Hugging Face provider not available');
      console.log('💡 Tip: Make sure HUGGING_FACE_API_KEY is set in environment variables');
    }

    console.log('\n🎉 Integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 8080');
      console.log('Run: npm run start:dashboard');
    }
  }
}

// Run the test
testHuggingFaceIntegration();