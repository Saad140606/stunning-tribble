import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText)
  );

  console.log('Navigating to http://localhost:3000/');
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  } catch (err) {
    console.error('Navigation error:', err);
  }
  
  console.log('Navigating to http://localhost:3000/admin');
  try {
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  } catch (err) {
    console.error('Navigation error:', err);
  }
  
  await browser.close();
  console.log('Done.');
})();
