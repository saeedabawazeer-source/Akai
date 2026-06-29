const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace the Play mode buttons above the screen
const oldButtons = `{/* Play mode buttons above screen */}
            <div className="flex space-x-6 mb-2">
              {modes.map((mode) => (
                <div key={mode} onClick={() => setPlayMode(mode)}
                  className={\`w-14 h-4 rounded-sm border cursor-pointer flex items-center justify-center text-[7px] font-bold
                  \${playMode === mode ? 'bg-red-600 border-red-400 text-white shadow-[0_0_8px_red]' : 'bg-gradient-to-b from-[#333] to-[#111] border-[#444] text-[#888]'}\`}>
                  {mode}
                </div>
              ))}
            </div>`;

const newButtons = `{/* B1, B2, B3 Function Buttons above screen */}
            <div className="flex space-x-6 mb-2">
              <div onClick={handleB1} className="w-14 h-4 rounded-sm border cursor-pointer bg-gradient-to-b from-[#333] to-[#111] border-[#444] shadow-[0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-px active:shadow-none"></div>
              <div onClick={handleB2} className="w-14 h-4 rounded-sm border cursor-pointer bg-gradient-to-b from-[#333] to-[#111] border-[#444] shadow-[0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-px active:shadow-none"></div>
              <div onClick={handleB3} className="w-14 h-4 rounded-sm border cursor-pointer bg-gradient-to-b from-[#333] to-[#111] border-[#444] shadow-[0_2px_4px_rgba(0,0,0,0.5)] active:translate-y-px active:shadow-none"></div>
            </div>`;

code = code.replace(oldButtons, newButtons);

// Remove `const modes = ['ONE SHOT', 'NOTE ON', 'LOOP'];`
code = code.replace(/const modes = \['ONE SHOT', 'NOTE ON', 'LOOP'\];\n/g, '');

// Add handleB1, handleB2, handleB3 functions right before button handlers
const bHandlers = `  // ─── Function Buttons (B1, B2, B3) ────────────────────
  const handleB1 = () => {
    if (screenMode === 'SAMPLE') {
      const cycle: any[] = ['Trim', 'Mix', 'Amp Env'];
      setSampleCol1(prev => cycle[(cycle.indexOf(prev) + 1) % 3]);
      setActiveSampleCol(1);
    }
  };
  const handleB2 = () => {
    if (screenMode === 'SAMPLE') {
      const cycle: any[] = ['Tune', 'Play'];
      setSampleCol2(prev => cycle[(cycle.indexOf(prev) + 1) % 2]);
      setActiveSampleCol(2);
    }
  };
  const handleB3 = () => {
    if (screenMode === 'SAMPLE') {
      const cycle: any[] = ['Filter', 'Filt Env'];
      setSampleCol3(prev => cycle[(cycle.indexOf(prev) + 1) % 2]);
      setActiveSampleCol(3);
    }
  };

  // ─── Button handlers ──────────────────────────────────`;

code = code.replace(/  \/\/ ─── Button handlers ──────────────────────────────────/, bHandlers);

fs.writeFileSync('src/App.tsx', code);
