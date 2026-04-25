// Test script for news summarization fixes
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test cases
const testCases = [
  {
    name: 'Telugu Weather Article',
    url: 'https://www.eenadu.net/telangana/weather/heavy-rains-expected',
    title: 'తెలంగాణలో మూడు రోజులు భారీ వర్షాలు'
  },
  {
    name: 'Telugu Politics Article',
    url: 'https://www.eenadu.net/telangana/politics/kavitha-party-news',
    title: 'కవిత పార్టీలో కీలక నిర్ణయాలు'
  },
  {
    name: 'English Article',
    url: 'https://www.eenadu.net/sports/cricket-news',
    title: 'Team India Wins Cricket Match Against Australia'
  }
];

async function testSummarization() {
  console.log('========================================');
  console.log('Testing News Summarization');
  console.log('========================================\n');

  // First check if server is running
  try {
    await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✓ Server is running\n');
  } catch (error) {
    console.error('✗ Server not running. Start with: node server.js');
    process.exit(1);
  }

  for (const test of testCases) {
    console.log(`\nTest: ${test.name}`);
    console.log('Title:', test.title);
    console.log('-'.repeat(50));

    try {
      const response = await axios.post(
        `${BASE_URL}/api/summarize`,
        {
          url: test.url,
          title: test.title
        },
        { timeout: 60000 }
      );

      const summary = response.data.summary;
      console.log('Summary:', summary);

      // Validation checks
      const hasTelugu = /[\u0C00-\u0C7F]/.test(summary);
      const hasHindi = /[\u0900-\u097F]/.test(summary);
      const hasThinking = /drafting|sentence 1|the user wants|i need to/i.test(summary);
      const isFallback = summary.includes('అందుబాటులో లేదు') || summary.includes('unavailable');

      console.log('\nValidation:');
      console.log('  - Telugu chars:', hasTelugu ? '✓' : '✗');
      console.log('  - No thinking text:', !hasThinking ? '✓' : '✗');
      console.log('  - Not fallback:', !isFallback ? '✓' : '⚠ (fallback used)');

    } catch (error) {
      console.error('✗ Test failed:', error.message);
    }
  }

  console.log('\n========================================');
  console.log('Tests completed');
  console.log('========================================');
}

// Run tests
testSummarization().catch(console.error);
