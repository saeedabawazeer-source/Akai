const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(/\| 'MENU_PROJECT';/, "| 'MENU_PROJECT'\n  | 'MENU_COMPRESSOR';");

fs.writeFileSync('src/types.ts', code);
