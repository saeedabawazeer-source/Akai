const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const \[activeSampleCol, setActiveSampleCol\] = useState<any>\(1\);/,
  `const [activeSampleCol, setActiveSampleCol] = useState<any>(1);
  const [chopMode, setChopMode] = useState(false);
  const [chopType, setChopType] = useState<string>('Threshold');`
);

// Update handleChop
code = code.replace(
  /const handleChop = \(\) => \{\n    if \(shiftHeld\) \{\n      setScreenMode\('MIXER'\);\n      consumeShift\(\);\n    \} else \{\n      if \(audioBuffer\) \{\n        const newSlices = autoChop\(audioBuffer, 16\);\n        setSlices\(newSlices\);\n        setChopMarkers\(newSlices.map\(s => s.start\)\);\n        setScreenMode\('SAMPLE_EDIT'\);\n        setSampleEditTab\('Chop'\);\n      \}\n    \}\n  \};/,
  `const handleChop = () => {
    if (shiftHeld) {
      setPlayMode('NOTE ON'); // SHIFT + CHOP = NOTE ON
      consumeShift();
    } else {
      setChopMode(!chopMode);
      setScreenMode('SAMPLE');
      if (!chopMode && audioBuffer) {
        // Just entering chop mode
        if (chopMarkers.length === 0) {
          const newSlices = autoChop(audioBuffer, 16);
          setSlices(newSlices);
          setChopMarkers(newSlices.map(s => s.start));
        }
      }
    }
  };`
);

fs.writeFileSync('src/App.tsx', code);
