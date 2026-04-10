const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content
                .replace(/catch \((.*?)any\)/g, 'catch ($1unknown)')
                .replace(/error: any/g, 'error: unknown');
            
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log('Fixed', fullPath);
            }
        }
    });
}
replaceInFiles('./src/app');
