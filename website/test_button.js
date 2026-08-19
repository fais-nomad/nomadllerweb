import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:5173/dashboard.html', { waitUntil: 'networkidle0' });
    
    const btn = await page.$('#upload-pdf-itinerary-btn');
    console.log("Button found:", !!btn);
    
    if (btn) {
        await btn.click();
        console.log("Button clicked!");
        // wait a bit for any resulting errors
        await new Promise(r => setTimeout(r, 1000));
    }
    
    await browser.close();
})();
