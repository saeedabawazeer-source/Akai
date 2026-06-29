const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Replace state declarations
code = code.replace(
  /const \[screenMode, setScreenMode\] = useState<ScreenMode>\('MAIN'\);\n  const \[sampleEditTab, setSampleEditTab\] = useState<SampleEditTab>\('Trim'\);\n  const \[programEditTab, setProgramEditTab\] = useState<ProgramEditTab>\('Layer'\);/g,
  `const [screenMode, setScreenMode] = useState<ScreenMode>('SAMPLE');
  
  // Sample Mode specific state
  const [sampleCol1, setSampleCol1] = useState<any>('Trim');
  const [sampleCol2, setSampleCol2] = useState<any>('Tune');
  const [sampleCol3, setSampleCol3] = useState<any>('Filter');
  const [activeSampleCol, setActiveSampleCol] = useState<any>(1);`
);

// 2. Replace button handlers for Mode section
const oldModeHandlers = `  const handleSampleButton = () => {
    if (shiftHeld) {
      setScreenMode('PROGRAM_EDIT');
      consumeShift();
    } else {
      setScreenMode('SAMPLE_EDIT');
    }
  };

  const handleSeqButton = () => {
    if (shiftHeld) {
      setScreenMode('SONG');
      consumeShift();
    } else {
      setScreenMode('SEQUENCE');
    }
  };

  const handlePadFXButton = () => {
    if (shiftHeld) {
      // Flex Beat - placeholder
      consumeShift();
    } else {
      setScreenMode('PAD_FX');
    }
  };

  const handleKnobFXButton = () => {
    if (shiftHeld) {
      // FX Select - placeholder
      consumeShift();
    } else {
      setScreenMode('KNOB_FX');
    }
  };`;

const newModeHandlers = `  const handleSampleButton = () => {
    if (shiftHeld) {
      setScreenMode('MENU_INPUT_CONFIG');
      consumeShift();
    } else {
      setScreenMode('SAMPLE');
    }
  };

  const handleSeqButton = () => {
    if (shiftHeld) {
      setScreenMode('STEP_EDIT');
      consumeShift();
    } else {
      setScreenMode('SEQUENCE');
    }
  };

  const handlePadFXButton = () => {
    if (shiftHeld) {
      setScreenMode('FLEX_BEAT');
      consumeShift();
    } else {
      setScreenMode('PAD_FX');
    }
  };

  const handleKnobFXButton = () => {
    if (shiftHeld) {
      setScreenMode('KNOB_FX_SELECT');
      consumeShift();
    } else {
      setScreenMode('KNOB_FX');
    }
  };`;

code = code.replace(oldModeHandlers, newModeHandlers);

// 3. Update the mode buttons in the JSX to match the manual text exactly
code = code.replace(
  /<MPCButton subLabel="INPUT CONFIG" color="gray" onClick=\{handleSampleButton\} active=\{screenMode === 'SAMPLE_EDIT' \|\| screenMode === 'PROGRAM_EDIT'\}>SAMPLE<\/MPCButton>/,
  `<MPCButton subLabel="INPUT CONFIG" color="gray" onClick={handleSampleButton} active={screenMode === 'SAMPLE' || screenMode === 'MENU_INPUT_CONFIG'}>SAMPLE</MPCButton>`
);

code = code.replace(
  /<MPCButton subLabel="STEP EDIT" color="gray" onClick=\{handleSeqButton\} active=\{screenMode === 'SEQUENCE' \|\| screenMode === 'SONG'\}>SEQ<\/MPCButton>/,
  `<MPCButton subLabel="STEP EDIT" color="gray" onClick={handleSeqButton} active={screenMode === 'SEQUENCE' || screenMode === 'STEP_EDIT'}>SEQ</MPCButton>`
);

code = code.replace(
  /<MPCButton subLabel="FLEX BEAT" color="orange" onClick=\{handlePadFXButton\} active=\{screenMode === 'PAD_FX'\}>PAD<br\/>FX<\/MPCButton>/,
  `<MPCButton subLabel="FLEX BEAT" color="orange" onClick={handlePadFXButton} active={screenMode === 'PAD_FX' || screenMode === 'FLEX_BEAT'}>PAD<br/>FX</MPCButton>`
);

code = code.replace(
  /<MPCButton subLabel="FX SELECT" color="orange" onClick=\{handleKnobFXButton\} active=\{screenMode === 'KNOB_FX'\}>KNOB<br\/>FX<\/MPCButton>/,
  `<MPCButton subLabel="FX SELECT" color="orange" onClick={handleKnobFXButton} active={screenMode === 'KNOB_FX' || screenMode === 'KNOB_FX_SELECT'}>KNOB<br/>FX</MPCButton>`
);

// 4. Also fix handleDataWheel mappings for Sample mode
code = code.replace(
  /if \(screenMode === 'SAMPLE_EDIT'\) \{\n      if \(sampleEditTab === 'Trim'\) setTrimEnd\(prev => Math.max\(0, Math.min\(100, prev \+ dx\)\)\);\n      if \(sampleEditTab === 'Chop'\) setSelectedChopMarker\(prev => Math.max\(0, Math.min\(chopMarkers.length - 1, prev \+ Math.sign\(dx\)\)\)\);\n    \}/,
  `if (screenMode === 'SAMPLE') {
      if (chopMode) setSelectedChopMarker(prev => Math.max(0, Math.min(chopMarkers.length - 1, prev + Math.sign(dx))));
    }`
);

// We need to remove PROGRAM_EDIT and MIXER from handleDataWheel as they are going away
code = code.replace(
  /if \(screenMode === 'PROGRAM_EDIT'\) \{\n      if \(programEditTab === 'Tune'\) \{\n        setAllPadSettings\(prev => prev.map\(\(s, i\) => i === \(activePad\|\|1\)-1 \? \{ \.\.\.s, tune: Math.max\(-24, Math.min\(24, s.tune \+ Math.sign\(dx\)\)\) \} : s\)\);\n      \}\n      if \(programEditTab === 'Filter'\) \{\n        setAllPadSettings\(prev => prev.map\(\(s, i\) => i === \(activePad\|\|1\)-1 \? \{ \.\.\.s, filterFreq: Math.max\(20, Math.min\(20000, s.filterFreq \+ dx \* 100\)\) \} : s\)\);\n      \}\n    \}\n    if \(screenMode === 'MIXER'\) \{\n      const padIdx = \(activePad \|\| 1\) - 1;\n      setAllPadSettings\(prev => prev.map\(\(s, i\) => i === padIdx \? \{ \.\.\.s, volume: Math.max\(0, Math.min\(100, s.volume \+ dx\)\) \} : s\)\);\n    \}/,
  ''
);

fs.writeFileSync('src/App.tsx', code);
