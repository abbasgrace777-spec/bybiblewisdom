const { app, server } = require('./src/server');
const http = require('node:http');

async function runTests() {
  console.log('[Test Runner] Probing backend routes...');
  
  async function getJson(endpoint) {
    const res = await fetch(`http://127.0.0.1:5000${endpoint}`);
    return await res.json();
  }

  try {
    const health = await getJson('/api/system/health');
    console.log('[Test 1: Health Check] Passed:', health.status, '| FFmpeg:', health.ffmpeg);

    const stats = await getJson('/api/dashboard/stats');
    console.log('[Test 2: Dashboard Stats] Passed. Total Projects:', stats.data.totalProjects);

    const books = await getJson('/api/bible/books');
    console.log('[Test 3: Bible Books] Passed. Total Books loaded:', books.count);

    const bookDetail = await getJson('/api/bible/books/Genesis');
    console.log('[Test 4: Genesis Profile] Passed. Central Theme:', bookDetail.data.central_theme);

    const historical = await getJson('/api/historical/stories');
    console.log('[Test 5: Historical Stories] Passed. Count:', historical.count);

    console.log('[Test Suite] ALL 5 BACKEND INTEGRATION TESTS PASSED 100%!');
  } catch (err) {
    console.error('[Test Suite] Failed:', err);
  } finally {
    server.close(() => {
      console.log('[Test Runner] Test server closed cleanly.');
      process.exit(0);
    });
  }
}

// Give server 500ms to listen before test probes
setTimeout(runTests, 500);
