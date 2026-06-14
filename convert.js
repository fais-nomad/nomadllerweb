import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dirs = ['public/images', 'public/images/real', 'public/images/team'];

dirs.forEach(dir => {
    if(!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if(file.endsWith('.png') || file.endsWith('.jpg')) {
            const ext = path.extname(file);
            const base = path.basename(file, ext);
            const inPath = path.join(dir, file);
            const outPath = path.join(dir, `${base}.webp`);
            sharp(inPath)
                .webp({ quality: 80 })
                .toFile(outPath)
                .then(() => console.log(`Converted ${inPath} to ${outPath}`))
                .catch(err => console.error(err));
        }
    });
});
