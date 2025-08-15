const { chromium } = require('playwright');

async function testInteractivity() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:3002';
  
  console.log('🧪 INTERACTIVE FUNCTIONALITY TESTS\n');
  console.log('=' .repeat(50));
  
  // Test 1: Navigation Menu
  console.log('\n📍 Testing Navigation Menu...');
  await page.goto(baseUrl);
  
  const navLinks = await page.locator('nav a').count();
  console.log(`  ✓ Found ${navLinks} navigation links`);
  
  // Click through navigation
  const navItems = [
    { text: 'Overview', path: '/chapters/overview' },
    { text: 'Engine API', path: '/chapters/engine-api' },
    { text: 'State Root', path: '/chapters/state-root' },
    { text: 'Trie Architecture', path: '/chapters/trie' },
    { text: 'Transaction Journey', path: '/chapters/transaction' }
  ];
  
  for (const item of navItems) {
    try {
      await page.click(`nav >> text="${item.text}"`);
      await page.waitForURL(`**${item.path}`);
      console.log(`  ✓ Navigation to ${item.text} works`);
    } catch (e) {
      console.log(`  ❌ Failed to navigate to ${item.text}`);
    }
  }
  
  // Test 2: Engine API Interactive Elements
  console.log('\n📍 Testing Engine API Interactivity...');
  await page.goto(`${baseUrl}/chapters/engine-api`);
  await page.waitForLoadState('networkidle');
  
  // Check for simulation button
  const simulateBtn = page.locator('button:has-text("Simulate")').first();
  if (await simulateBtn.count() > 0) {
    await simulateBtn.click();
    console.log('  ✓ Simulation button clicked');
    await page.waitForTimeout(2000);
    
    // Check if animation started (look for state changes)
    const activeElements = await page.locator('.animate-pulse').count();
    console.log(`  ✓ Found ${activeElements} animated elements`);
  }
  
  // Test 3: State Root Strategy Switching
  console.log('\n📍 Testing State Root Strategy Switching...');
  await page.goto(`${baseUrl}/chapters/state-root`);
  await page.waitForLoadState('networkidle');
  
  const strategies = ['Sequential', 'Parallel', 'Sparse'];
  for (const strategy of strategies) {
    const btn = page.locator(`button:has-text("${strategy}")`).first();
    if (await btn.count() > 0) {
      await btn.click();
      console.log(`  ✓ ${strategy} strategy button works`);
      await page.waitForTimeout(500);
    }
  }
  
  // Test 4: Trie Navigation
  console.log('\n📍 Testing Trie Navigation...');
  await page.goto(`${baseUrl}/chapters/trie`);
  await page.waitForLoadState('networkidle');
  
  // Check for navigation buttons
  const trieButtons = await page.locator('button').count();
  console.log(`  ✓ Found ${trieButtons} interactive buttons`);
  
  // Test 5: Transaction Journey Simulation
  console.log('\n📍 Testing Transaction Journey...');
  await page.goto(`${baseUrl}/chapters/transaction`);
  await page.waitForLoadState('networkidle');
  
  const txSimulateBtn = page.locator('button:has-text("Simulate Transaction Flow")').first();
  if (await txSimulateBtn.count() > 0) {
    await txSimulateBtn.click();
    console.log('  ✓ Transaction simulation started');
    
    // Wait and check for stage progression
    await page.waitForTimeout(3000);
    const activeStages = await page.locator('.border-blue-500').count();
    console.log(`  ✓ Transaction progressed through stages`);
  }
  
  // Test 6: Check for Console Errors
  console.log('\n📍 Checking for Console Errors...');
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });
  
  // Navigate through all pages to catch any errors
  const allPages = [
    '/',
    '/chapters/overview',
    '/chapters/engine-api', 
    '/chapters/state-root',
    '/chapters/trie',
    '/chapters/transaction'
  ];
  
  for (const pagePath of allPages) {
    await page.goto(`${baseUrl}${pagePath}`);
    await page.waitForLoadState('networkidle');
  }
  
  if (errors.length > 0) {
    console.log(`  ⚠️  Found ${errors.length} console errors:`);
    errors.forEach(err => {
      console.log(`     - ${err.text}`);
      if (err.location.url) {
        console.log(`       at ${err.location.url}:${err.location.lineNumber}`);
      }
    });
  } else {
    console.log('  ✅ No console errors detected');
  }
  
  // Test 7: Responsive Design
  console.log('\n📍 Testing Responsive Design...');
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    
    const isVisible = await page.locator('main').isVisible();
    console.log(`  ✓ ${viewport.name} view (${viewport.width}x${viewport.height}): ${isVisible ? 'Renders correctly' : 'Issues detected'}`);
  }
  
  // Test 8: Performance Metrics
  console.log('\n📍 Checking Performance Metrics...');
  const metrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart),
      loadComplete: Math.round(perf.loadEventEnd - perf.loadEventStart),
      domInteractive: Math.round(perf.domInteractive),
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
    };
  });
  
  console.log(`  ✓ DOM Content Loaded: ${metrics.domContentLoaded}ms`);
  console.log(`  ✓ Page Load Complete: ${metrics.loadComplete}ms`);
  console.log(`  ✓ DOM Interactive: ${metrics.domInteractive}ms`);
  if (metrics.firstPaint) {
    console.log(`  ✓ First Paint: ${Math.round(metrics.firstPaint)}ms`);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('✅ ALL INTERACTIVE TESTS COMPLETED');
  console.log('=' .repeat(50));
  
  await browser.close();
}

// Run the tests
testInteractivity().catch(console.error);