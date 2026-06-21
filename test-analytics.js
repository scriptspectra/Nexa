const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });

  console.log('Navigating to http://localhost:3000/analytics...');
  await page.goto('http://localhost:3000/analytics', { waitUntil: 'networkidle0' });
  
  console.log('Done.');
  await browser.close();
})();
