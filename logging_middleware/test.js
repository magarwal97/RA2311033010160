/**
 * Test script for the Logging Middleware
 * 
 * Run: node test.js
 * 
 * This script tests the Log function by sending sample log entries
 * to the evaluation server and validating the responses.
 */

import { Log, configureLogger, createLogger } from './index.js';

// Configure with auth credentials
// Token will be fetched fresh before running tests
async function getAuthToken() {
  const body = {
    email: 'ma6864@srmist.edu.in',
    name: 'mushkan agarwal',
    rollNo: 'ra2311033010160',
    accessCode: 'QkbpxH',
    clientID: '346b9749-66ed-4ae2-a79d-2d9b336f44e3',
    clientSecret: 'HeEwYHNpMYZCBaPn',
  };

  try {
    const response = await fetch('http://20.207.122.201/evaluation-service/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Auth failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to get auth token:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('=== Logging Middleware Test Suite ===\n');

  // Step 1: Get fresh auth token
  console.log('1. Fetching auth token...');
  const token = await getAuthToken();
  if (!token) {
    console.error('   FAILED: Could not obtain auth token. Exiting.');
    process.exit(1);
  }
  console.log('   SUCCESS: Auth token obtained.\n');

  // Step 2: Configure the logger
  configureLogger({
    token,
    enableConsoleOutput: true,
    enableRemoteLogging: true,
  });

  // Step 3: Test various log levels with frontend stack
  console.log('2. Testing frontend log entries...\n');

  const testCases = [
    {
      stack: 'frontend',
      level: 'info',
      package: 'component',
      message: 'NotificationList mounted OK',
    },
    {
      stack: 'frontend',
      level: 'error',
      package: 'api',
      message: 'Fetch notifications failed: timeout',
    },
    {
      stack: 'frontend',
      level: 'warn',
      package: 'state',
      message: 'Cache expired, triggering refresh',
    },
    {
      stack: 'frontend',
      level: 'debug',
      package: 'hook',
      message: 'useNotifications re-rendered: 3 new',
    },
    {
      stack: 'frontend',
      level: 'info',
      package: 'page',
      message: 'Dashboard page loaded in 342ms',
    },
    {
      stack: 'frontend',
      level: 'info',
      package: 'utils',
      message: 'Date formatter init: locale en-IN',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const result = await Log(tc.stack, tc.level, tc.package, tc.message);
    if (result && result.logID) {
      console.log(`   PASS: [${tc.level}/${tc.package}] logID = ${result.logID}`);
      passed++;
    } else {
      console.log(`   FAIL: [${tc.level}/${tc.package}] No logID returned`);
      failed++;
    }
    // Small delay between requests to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  // Step 4: Test the scoped logger
  console.log('\n3. Testing scoped logger (createLogger)...\n');

  const componentLogger = createLogger('frontend', 'component');
  const scopedResult = await componentLogger.info('Scoped logger: component init OK');
  if (scopedResult && scopedResult.logID) {
    console.log(`   PASS: Scoped logger logID = ${scopedResult.logID}`);
    passed++;
  } else {
    console.log('   FAIL: Scoped logger returned no logID');
    failed++;
  }

  // Step 5: Test validation (should fail gracefully)
  console.log('\n4. Testing input validation...\n');

  const invalidResult1 = await Log('invalid_stack', 'info', 'component', 'test');
  if (invalidResult1 === null) {
    console.log('   PASS: Invalid stack rejected correctly');
    passed++;
  } else {
    console.log('   FAIL: Invalid stack was not rejected');
    failed++;
  }

  const invalidResult2 = await Log('frontend', 'critical', 'component', 'test');
  if (invalidResult2 === null) {
    console.log('   PASS: Invalid level rejected correctly');
    passed++;
  } else {
    console.log('   FAIL: Invalid level was not rejected');
    failed++;
  }

  const invalidResult3 = await Log('frontend', 'info', 'invalid_pkg', 'test');
  if (invalidResult3 === null) {
    console.log('   PASS: Invalid package rejected correctly');
    passed++;
  } else {
    console.log('   FAIL: Invalid package was not rejected');
    failed++;
  }

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total:  ${passed + failed}`);
  console.log('====================\n');
}

runTests().catch(console.error);
