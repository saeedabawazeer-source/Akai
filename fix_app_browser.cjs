const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add states for Browser
code = code.replace(
  /const \[selectedBrowserKit, setSelectedBrowserKit\] = useState\(0\);/,
  `const [selectedBrowserKit, setSelectedBrowserKit] = useState(0);
  const [browserPreviewOn, setBrowserPreviewOn] = useState(true);
  const [browserDrive, setBrowserDrive] = useState<'Internal' | 'External'>('Internal');`
);

// Update handleB1, B2, B3
const b1Start = /const handleB1 = \(\) => \{\n    if \(screenMode === 'SAMPLE'\) \{/;
code = code.replace(
  b1Start,
  `const handleB1 = () => {
    if (screenMode === 'BROWSER') {
      setScreenMode('SAMPLE'); // Back button
    } else if (screenMode === 'SAMPLE') {`
);

const b2Start = /const handleB2 = \(\) => \{\n    if \(screenMode === 'SAMPLE'\) \{/;
code = code.replace(
  b2Start,
  `const handleB2 = () => {
    if (screenMode === 'BROWSER') {
      setBrowserDrive(prev => prev === 'Internal' ? 'External' : 'Internal');
    } else if (screenMode === 'SAMPLE') {`
);

const b3Start = /const handleB3 = \(\) => \{\n    if \(screenMode === 'SAMPLE'\) \{/;
code = code.replace(
  b3Start,
  `const handleB3 = () => {
    if (screenMode === 'BROWSER') {
      setBrowserPreviewOn(!browserPreviewOn);
    } else if (screenMode === 'SAMPLE') {`
);

// Update renderScreen for Browser
const oldRenderBrowser = /<BrowserScreen[\s\S]*?onLoadKit=\{loadKit\}\s*\/>/;
const newRenderBrowser = `<BrowserScreen
          presetKits={PRESET_KITS}
          selectedKit={selectedBrowserKit}
          isPreviewOn={browserPreviewOn}
          drive={browserDrive}
        />`;
code = code.replace(oldRenderBrowser, newRenderBrowser);

// Add encoder click to load kit when in browser
// Right now encoder doesn't have an onClick. 
// Wait, the encoder is rendered around line 750: `<div className="w-[75px] h-[75px] ..."` - That's the Data Wheel.
// Wait, MPC Sample has an ENCODER button? Yes, "18. Encoder: Turn this knob to navigate menus... Press the ENCODER to select a setting".
// In the current UI, is there an Encoder? We have the Data Wheel which is large, and no separate encoder in the SVG?
// Page 16 shows `Encoder` is below the screen (the Data Wheel IS the Encoder, it has a push function!).
// Oh, the Data Wheel is the Encoder! It's one giant push-button knob.
code = code.replace(
  /className="w-\[75px\] h-\[75px\] rounded-full shadow-\[0_8px_15px_rgba\(0,0,0,0\.3\)\] bg-gradient-to-b from-\[#e8e9eb\] to-\[#b0b1b4\] border border-\[#a0a0a0\] flex items-center justify-center cursor-ew-resize touch-none"/,
  `className="w-[75px] h-[75px] rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.3)] bg-gradient-to-b from-[#e8e9eb] to-[#b0b1b4] border border-[#a0a0a0] flex items-center justify-center cursor-ns-resize touch-none active:scale-[0.98] transition-transform"
                onClick={() => {
                  if (screenMode === 'BROWSER') {
                    loadKit(selectedBrowserKit);
                  }
                }}`
);

fs.writeFileSync('src/App.tsx', code);
