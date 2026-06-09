import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Point to the new luxury template
        const htmlPath = 'file://' + path.join(__dirname, 'valley_of_flowers_template.html');
        await page.goto(htmlPath, { waitUntil: 'networkidle0' });
        
        const pdfPath = path.join(__dirname, 'public', 'Valley_of_Flowers_Itinerary.pdf');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 } // Zero margin for full bleed
        });
        
        console.log(`PDF successfully generated at ${pdfPath}`);
        await browser.close();
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
})();
