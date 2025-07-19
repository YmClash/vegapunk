// Quick test to check if backend starts
console.log('Testing backend startup...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Test TypeScript compilation
try {
  require('ts-node/register');
  console.log('✅ ts-node registered successfully');
} catch (error) {
  console.error('❌ ts-node registration failed:', error.message);
}

// Test if the main file exists
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src/index.ts');
if (fs.existsSync(indexPath)) {
  console.log('✅ src/index.ts exists');
} else {
  console.error('❌ src/index.ts not found');
}

console.log('\nTo start the backend, run: npm run dev');