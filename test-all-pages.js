const { chromium } = require('playwright');

async function testAllPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:3002';
  const results = [];
  
  // List of all pages to test
  const pages = [
    { path: '/', name: 'Home Page' },
    { path: '/chapters/overview', name: 'Overview Chapter' },
    { path: '/chapters/engine-api', name: 'Engine API Chapter' },
    { path: '/chapters/state-root', name: 'State Root Chapter' },
    { path: '/chapters/trie', name: 'Trie Architecture Chapter' },
    { path: '/chapters/transaction', name: 'Transaction Journey Chapter' }
  ];
  
  // Test each page
  for (const pageInfo of pages) {
    console.log(`\n📍 Testing ${pageInfo.name}...`);
    const url = `${baseUrl}${pageInfo.path}`;
    
    try {
      // Navigate to the page
      const response = await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Check response status
      const status = response.status();
      console.log(`  ✓ Page loaded with status: ${status}`);
      
      // Check for console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('domcontentloaded');
      
      // Check if main content is visible
      const hasContent = await page.locator('main').count() > 0;
      console.log(`  ✓ Main content area: ${hasContent ? 'Found' : 'Missing'}`);
      
      // Check for navigation menu
      const hasNav = await page.locator('nav').count() > 0;
      console.log(`  ✓ Navigation menu: ${hasNav ? 'Found' : 'Missing'}`);
      
      // Take a screenshot
      await page.screenshot({ 
        path: `screenshot-${pageInfo.path.replace(/\//g, '-') || 'home'}.png`,
        fullPage: true 
      });
      console.log(`  ✓ Screenshot saved`);
      
      // Check for any visible error messages
      const errorElements = await page.locator('text=/error|Error|ERROR/i').count();
      if (errorElements > 0) {
        console.log(`  ⚠️  Found ${errorElements} error message(s) on page`);
      }
      
      // Test interactive elements if present
      const buttons = await page.locator('button').count();
      console.log(`  ✓ Found ${buttons} button(s)`);
      
      // Check page title
      const title = await page.title();
      console.log(`  ✓ Page title: "${title}"`);
      
      // Record results
      results.push({
        page: pageInfo.name,
        url: url,
        status: status,
        hasContent: hasContent,
        hasNav: hasNav,
        buttonCount: buttons,
        errorCount: errorElements,
        consoleErrors: errors.length
      });
      
      // Small delay between pages
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.error(`  ❌ Error testing ${pageInfo.name}:`, error.message);
      results.push({
        page: pageInfo.name,
        url: url,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.page}: FAILED - ${result.error}`);
    } else {
      const issues = [];
      if (result.status !== 200) issues.push(`HTTP ${result.status}`);
      if (!result.hasContent) issues.push('No content');
      if (!result.hasNav) issues.push('No navigation');
      if (result.errorCount > 0) issues.push(`${result.errorCount} errors`);
      if (result.consoleErrors > 0) issues.push(`${result.consoleErrors} console errors`);
      
      if (issues.length === 0) {
        console.log(`✅ ${result.page}: PASSED`);
      } else {
        console.log(`⚠️  ${result.page}: ISSUES - ${issues.join(', ')}`);
      }
    }
  });
  
  await browser.close();
}

// Run the tests
testAllPages().catch(console.error);