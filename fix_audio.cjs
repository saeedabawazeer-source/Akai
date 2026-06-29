const fs = require('fs');
let code = fs.readFileSync('src/audioEngine.ts', 'utf-8');

code = code.replace(/gainNode\.gain\.exponentialRampToValueAtTime\(0\.001, time \+ 0\.05\);/g, "gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);\n    gainNode.gain.setValueAtTime(0, time + 0.05);\n    if (source.stop) source.stop(time + 0.1);");

fs.writeFileSync('src/audioEngine.ts', code);
