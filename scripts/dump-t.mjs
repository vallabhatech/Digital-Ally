import fs from 'fs';
import path from 'path';

function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.matchAll(/t\(['"]([^'"]+)['"]\)/g);
            for (const match of matches) {
                console.log(match[1]);
            }
        }
    }
}

searchDirectory('./src');
