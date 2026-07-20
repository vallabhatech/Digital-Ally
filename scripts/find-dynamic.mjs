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
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                // Find t( followed by something that is not ' or "
                if (line.match(/t\([^\s'"]/)) {
                    console.log(`FOUND in ${fullPath}:${index + 1}: ${line.trim()}`);
                }
            });
        }
    }
}

searchDirectory('./src');
