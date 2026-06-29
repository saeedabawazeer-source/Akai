const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Import MenuScreen
code = code.replace(
  /import BrowserScreen from '.\/screens\/BrowserScreen';/,
  "import BrowserScreen from './screens/BrowserScreen';\nimport MenuScreen from './screens/MenuScreen';"
);

// Add menu state
code = code.replace(
  /const \[browserDrive, setBrowserDrive\] = useState<'Internal' \| 'External'>\('Internal'\);/,
  `const [browserDrive, setBrowserDrive] = useState<'Internal' | 'External'>('Internal');
  const [menuSelectedIndex, setMenuSelectedIndex] = useState(0);`
);

// Update B1, B2, B3 for Menus
const handleB1 = /const handleB1 = \(\) => \{\n    if \(screenMode === 'BROWSER'\) \{\n      setScreenMode\('SAMPLE'\); \/\/ Back button\n    \} else if \(screenMode === 'SAMPLE'\) \{/;
code = code.replace(handleB1, `const handleB1 = () => {
    if (screenMode === 'BROWSER' || screenMode.startsWith('MENU_')) {
      setScreenMode('SAMPLE'); // Back button
    } else if (screenMode === 'SAMPLE') {`);

// Add renderMenuScreen function inside App component
const renderMenuScreenInsert = `  const renderMenuScreen = () => {
    switch (screenMode) {
      case 'MENU_INPUT_CONFIG':
        return <MenuScreen title="Input Config" selectedIndex={menuSelectedIndex} items={[
          { label: 'Source', value: 'Mic' },
          { label: 'Monitor', value: 'Auto' },
          { label: 'Threshold', value: '-40 dB' },
          { label: 'Rec Length', value: 'Free' },
          { label: 'Rec Input Effects', value: 'Off' }
        ]} rightActionText="" />;
      case 'MENU_FADER':
        return <MenuScreen title="Fader" selectedIndex={menuSelectedIndex} items={[
          { label: 'Pad Volume' },
          { label: 'Pad Pan' },
          { label: 'Pad Tune' },
          { label: 'Pad Amp Attack' },
          { label: 'Pad Amp Decay' },
          { label: 'Pad Filter Cutoff' },
          { label: 'Kit Volume' }
        ]} rightActionText="ON" />;
      case 'MENU_TIME_CORRECT':
        return <MenuScreen title="Time Correct" selectedIndex={menuSelectedIndex} items={[
          { label: 'Quantize', value: '1/16' },
          { label: 'Shift', value: '0' },
          { label: 'Swing', value: '50%' }
        ]} rightActionText="Do It!" />;
      case 'MENU_MIDI_CONFIG':
        return <MenuScreen title="MIDI Config" selectedIndex={menuSelectedIndex} items={[
          { label: 'MIDI Port', value: 'External' },
          { label: 'MIDI In Channel', value: 'All' },
          { label: 'MIDI Out Channel', value: '1' },
          { label: 'Pad MIDI In', value: 'Off' },
          { label: 'Pad MIDI Out', value: 'Always' },
          { label: 'MIDI Sync In', value: 'Off' },
          { label: 'MIDI Sync Out', value: 'Off' }
        ]} rightActionText="" />;
      case 'MENU_PROJECT':
        return <MenuScreen title="Project" selectedIndex={menuSelectedIndex} items={[
          { label: 'Load Project' },
          { label: 'Save Project' },
          { label: 'New Project' },
          { label: 'SD Card Access' }
        ]} rightActionText="" />;
      case 'MENU_COMPRESSOR':
        return <MenuScreen title="Compressor" selectedIndex={menuSelectedIndex} items={[
          { label: 'Color', value: 'On' },
          { label: 'Attack', value: '10 ms' },
          { label: 'Release', value: '100 ms' },
          { label: 'Amount', value: '50%' }
        ]} rightActionText="Bypass" />;
      default:
        return null;
    }
  };

  // ─── Render Screen Logic ───────────────────────────────`;

code = code.replace(/  \/\/ ─── Render Screen Logic ───────────────────────────────/, renderMenuScreenInsert);

// Add to switch in renderScreen
const renderScreenSwitch = `      case 'BROWSER':
        return (
          <BrowserScreen`;

code = code.replace(renderScreenSwitch, `      case 'MENU_INPUT_CONFIG':
      case 'MENU_FADER':
      case 'MENU_TIME_CORRECT':
      case 'MENU_MIDI_CONFIG':
      case 'MENU_PROJECT':
      case 'MENU_COMPRESSOR':
        return renderMenuScreen();
      case 'BROWSER':
        return (
          <BrowserScreen`);

// Update Encoder to navigate menus
// handleDataWheel
code = code.replace(
  /if \(screenMode === 'BROWSER'\) setSelectedBrowserKit\(prev => Math.max\(0, Math.min\(PRESET_KITS.length - 1, prev \+ Math.sign\(dx\)\)\)\);/,
  `if (screenMode === 'BROWSER') setSelectedBrowserKit(prev => Math.max(0, Math.min(PRESET_KITS.length - 1, prev + Math.sign(dx))));
    if (screenMode.startsWith('MENU_')) setMenuSelectedIndex(prev => Math.max(0, prev + Math.sign(dx)));`
);

fs.writeFileSync('src/App.tsx', code);
