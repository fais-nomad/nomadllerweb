import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        await page.setRequestInterception(true);
        page.on('request', req => {
            const url = req.url();
            if (url.includes('/images/')) {
                const imgName = url.substring(url.indexOf('/images/') + 8);
                const imgPath = path.join(__dirname, 'public', 'images', imgName.split('?')[0]);
                if (fs.existsSync(imgPath)) {
                    req.respond({
                        status: 200,
                        contentType: imgPath.endsWith('.webp') ? 'image/webp' : imgPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
                        body: fs.readFileSync(imgPath)
                    });
                    return;
                }
            }
            req.continue();
        });

        // Point to the new luxury template
        const htmlPath = 'file://' + path.join(__dirname, 'annapurna_luxury_template.html');
        await page.goto(htmlPath, { waitUntil: 'networkidle0' });
        
        // Hide UI navigation buttons and reset margins/padding before capturing PDF
        await page.evaluate(() => {
            document.body.style.padding = '0';
            document.body.style.margin = '0';
            document.body.style.background = 'none';
            const btns = document.querySelectorAll('#pdf-control-bar, #download-pdf-btn, #top-download-btn, button');
            btns.forEach(b => b.style.display = 'none');
            const pages = document.querySelectorAll('.page');
            pages.forEach(p => {
                p.style.margin = '0';
                p.style.boxShadow = 'none';
                p.style.width = '210mm';
                p.style.height = '297mm';
                p.style.overflow = 'hidden';
            });
        });

        const pdfPath = path.join(__dirname, 'public', 'Annapurna_Circuit_Itinerary.pdf');
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
