const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Initial state
code = code.replace(
  /const \[screenMode, setScreenMode\] = useState<ScreenMode>\('MAIN'\);/,
  `const [screenMode, setScreenMode] = useState<ScreenMode>('SAMPLE');`
);

// 2. handleSampleButton (around line 338)
code = code.replace(
  /const handleSampleButton = \(\) => \{\n    setScreenMode\(shiftHeld \? 'PROGRAM_EDIT' : 'SAMPLE_EDIT'\);\n    if \(shiftHeld\) consumeShift\(\);\n  \};/,
  `const handleSampleButton = () => {\n    setScreenMode(shiftHeld ? 'MENU_INPUT_CONFIG' : 'SAMPLE');\n    if (shiftHeld) consumeShift();\n  };`
);

// 3. handleSeqButton (around line 342)
code = code.replace(
  /const handleSeqButton = \(\) => \{\n    setScreenMode\(shiftHeld \? 'SONG' : 'SEQUENCE'\);\n    if \(shiftHeld\) consumeShift\(\);\n  \};/,
  `const handleSeqButton = () => {\n    setScreenMode(shiftHeld ? 'STEP_EDIT' : 'SEQUENCE');\n    if (shiftHeld) consumeShift();\n  };`
);

// 4. handlePadFXButton (around line 346)
code = code.replace(
  /const handlePadFXButton = \(\) => \{\n    setScreenMode\('PAD_FX'\);\n  \};/,
  `const handlePadFXButton = () => {\n    setScreenMode(shiftHeld ? 'FLEX_BEAT' : 'PAD_FX');\n    if (shiftHeld) consumeShift();\n  };`
);

// 5. handleKnobFXButton (around line 350)
code = code.replace(
  /const handleKnobFXButton = \(\) => \{\n    setScreenMode\('KNOB_FX'\);\n  \};/,
  `const handleKnobFXButton = () => {\n    setScreenMode(shiftHeld ? 'KNOB_FX_SELECT' : 'KNOB_FX');\n    if (shiftHeld) consumeShift();\n  };`
);

// 6. After recording stops (around line 491)
code = code.replace(
  /setScreenMode\('SAMPLE_EDIT'\);/g,
  `setScreenMode('SAMPLE');`
);

// 7. loadKit (around line 563)
code = code.replace(
  /setScreenMode\('MAIN'\);/g,
  `setScreenMode('SAMPLE');`
);

// 8. Screen onClick (around line 673)
code = code.replace(
  /onClick=\{\(\) => \{ if \(screenMode !== 'MAIN'\) setScreenMode\('MAIN'\); \}\}/,
  ``
);

fs.writeFileSync('src/App.tsx', code);
