const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Update releasePad first
code = code.replace(
  /const releasePad = useCallback\(\(id\) => \{[\s\S]*?\}, \[playMode, activePad, screenMode\]\);/,
  `const releasePad = useCallback((id) => {
    setActivePad(null);
    if (noteRepeatRef.current) {
      clearInterval(noteRepeatRef.current);
      noteRepeatRef.current = null;
    }
    if (screenMode === 'PAD_FX') { setActiveFXPad(null); return; }
    if (playMode === 'NOTE ON' || playMode === 'LOOP') {
      const i = id || activePad;
      if (i && activeNodesRef.current[i]) {
        stopAudioNodes(activeNodesRef.current[i]);
        delete activeNodesRef.current[i];
      }
    }
  }, [playMode, activePad, screenMode]);`
);

// We need to inject the repeat logic into triggerPad.
// Since triggerPad is long, let's just use string replacement carefully.
// triggerPad starts with:
//   const triggerPad = useCallback((id) => {
//     setActivePad(id);
//     if (activeNodesRef.current[id]) stopAudioNodes(activeNodesRef.current[id]);

const triggerStart = `  const triggerPad = useCallback((id) => {
    setActivePad(id);
    if (activeNodesRef.current[id]) stopAudioNodes(activeNodesRef.current[id]);

    if (noteRepeat) {
      if (noteRepeatRef.current) clearInterval(noteRepeatRef.current);
      const intervalMs = (60000 / bpm) / 4; // 16th notes
      noteRepeatRef.current = setInterval(() => {
        // We need a helper to actually play the sound without resetting activePad state loops
        playPadSound(id);
      }, intervalMs);
    }

    playPadSound(id);
  }, [slices, audioBuffer, mainVolume, playMode, padSynthTypes, allPadSettings, screenMode, effects, muteMode, isSeqRecording, currentStep, sixteenLevels, sixteenLevelsPad, noteRepeat, bpm]);

  const playPadSound = (id) => {
    if (activeNodesRef.current[id]) stopAudioNodes(activeNodesRef.current[id]);`;

code = code.replace(
  /  const triggerPad = useCallback\(\(id\) => \{\n    setActivePad\(id\);\n    if \(activeNodesRef\.current\[id\]\) stopAudioNodes\(activeNodesRef\.current\[id\]\);/g,
  triggerStart
);

// Now we need to close playPadSound and update triggerPad's dependency array.
code = code.replace(
  /    if \(nodes\) activeNodesRef\.current\[id\] = nodes;\n  \}, \[slices, audioBuffer, mainVolume, playMode, padSynthTypes, allPadSettings, screenMode, effects, muteMode, isSeqRecording, currentStep, sixteenLevels, sixteenLevelsPad\]\);/g,
  `    if (nodes) activeNodesRef.current[id] = nodes;
  };`
);

fs.writeFileSync('src/App.tsx', code);
