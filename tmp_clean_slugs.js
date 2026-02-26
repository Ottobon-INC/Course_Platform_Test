const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace hardcoded lesson paths with dynamic 'start'
    if (content.includes('/learn/welcome-to-ai-journey')) {
        content = content.replace(/\/learn\/welcome-to-ai-journey/g, '/learn/start');
        changed = true;
    }
    if (content.includes('/learn/introduction-to-ai-web-development')) {
        content = content.replace(/\/learn\/introduction-to-ai-web-development/g, '/learn/start');
        changed = true;
    }

    // Clean up explicit 'ai-native-fullstack-developer' strings where they form literal URL paths
    // E.g. `/course/ai-native-fullstack-developer/learn/start` -> `/course/${DEFAULT_COURSE_ID}/learn/start`
    // We'll leave the ones in constant files alone, or just replace simple strings.

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Finished updating ${changedFiles} files.`);
