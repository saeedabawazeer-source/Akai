const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add missing state variables
const stateInsert = `  const [activeSampleCol, setActiveSampleCol] = useState(1);
  const [sampleCol1, setSampleCol1] = useState('Trim');
  const [sampleCol2, setSampleCol2] = useState('Tune');
  const [sampleCol3, setSampleCol3] = useState('Filter');
  const [chopMode, setChopMode] = useState(false);
  const [sixteenLevelsType, setSixteenLevelsType] = useState('Velocity');
  const [isReversed, setIsReversed] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [chopType, setChopType] = useState('Auto');
`;

code = code.replace(/  const \[sixteenLevelsPad, setSixteenLevelsPad\] = useState\(1\);/, `  const [sixteenLevelsPad, setSixteenLevelsPad] = useState(1);\n${stateInsert}`);

// 2. Fix B1, B2, B3 logic for SAMPLE mode to cycle columns
const bButtonsLogic = `  const handleB1 = () => {
    if (screenMode === 'BROWSER' || screenMode.startsWith('MENU_')) setScreenMode('SAMPLE');
    else if (screenMode === 'SAMPLE') {
      setActiveSampleCol(1);
      setSampleCol1(prev => prev === 'Trim' ? 'Mix' : prev === 'Mix' ? 'Amp Env' : 'Trim');
    }
  };
  const handleB2 = () => {
    if (screenMode === 'SAMPLE') {
      setActiveSampleCol(2);
      setSampleCol2(prev => prev === 'Tune' ? 'Play' : 'Tune');
    }
  };
  const handleB3 = () => {
    if (screenMode === 'SAMPLE') {
      setActiveSampleCol(3);
      setSampleCol3(prev => prev === 'Filter' ? 'Filt Env' : 'Filter');
    }
  };`;

code = code.replace(/  const handleB1 = \(\) => \{[\s\S]*?  \};\n  const handleB2 = \(\) => \{\n  \};\n  const handleB3 = \(\) => \{\n  \};/, bButtonsLogic);

// 3. Update renderScreen switch
const renderSampleScreen = `      case 'SAMPLE':
        return <SampleScreen
          audioBuffer={audioBuffer} activePad={activePad || 1} padBank={padBank} padAssignments={padAssignments}
          sampleCol1={sampleCol1} sampleCol2={sampleCol2} sampleCol3={sampleCol3} activeSampleCol={activeSampleCol}
          padSettings={allPadSettings[(activePad || 1) - 1]} trimStart={trimStart} trimEnd={trimEnd} loopStart={loopStart}
          chopMode={chopMode} chopType={chopType} chopMarkers={chopMarkers} selectedChopMarker={selectedChopMarker}
          playMode={playMode} sixteenLevels={sixteenLevels} sixteenLevelsType={sixteenLevelsType} isReversed={isReversed}
          onWaveformClick={() => {}}
        />;`;

code = code.replace(/      case 'MAIN':[\s\S]*?padAssignments=\{padAssignments\} \/>;/, renderSampleScreen);

// Update default case to fallback to SAMPLE
code = code.replace(/      default:\n        return <MainScreen[\s\S]*?padAssignments=\{padAssignments\} \/>;/, `      default:\n${renderSampleScreen.replace("case 'SAMPLE':", "")}`);

// Remove obsolete MainScreen import
code = code.replace(/import MainScreen from '.\/screens\/MainScreen';\n/, '');

fs.writeFileSync('src/App.tsx', code);
