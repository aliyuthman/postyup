// Debug script to test API endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3001';
  
  const endpoints = [
    '/health',
    '/api/templates',
    '/api/templates/seed'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🧪 Testing ${endpoint}...`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`Response length: ${text.length}`);
      console.log(`First 200 chars: ${text.substring(0, 200)}...`);
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        console.log(`✅ Valid JSON:`, json);
      } catch (e) {
        console.log(`❌ Invalid JSON - likely HTML error page`);
        if (text.includes('<html>')) {
          console.log(`🚨 Received HTML instead of JSON`);
        }
      }
    } catch (error) {
      console.log(`❌ Request failed:`, error.message);
    }
  }
};

// Run if in Node.js environment
if (typeof window === 'undefined') {
  testEndpoints();
}