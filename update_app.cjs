const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /<SampleEditScreen\s+audioBuffer=\{audioBuffer\}\s+slices=\{slices\}\s+activePad=\{activePad \|\| 1\}\s+activeSubTab=\{sampleEditTab\}\s+setActiveSubTab=\{setSampleEditTab\}\s+trimStart=\{trimStart\}\s+trimEnd=\{trimEnd\}\s+chopMarkers=\{chopMarkers\}\s+selectedChopMarker=\{selectedChopMarker\}\s+padAssignments=\{padAssignments\}\s*\/>/,
  `<SampleEditScreen
                audioBuffer={audioBuffer}
                slices={slices}
                activePad={activePad || 1}
                activeSubTab={sampleEditTab}
                setActiveSubTab={setSampleEditTab}
                trimStart={trimStart}
                trimEnd={trimEnd}
                chopMarkers={chopMarkers}
                selectedChopMarker={selectedChopMarker}
                padAssignments={padAssignments}
                onAutoChop={handleChop}
                onAddManualChop={(pos) => {
                  setChopMarkers(prev => {
                    const newMarkers = [...prev, pos].sort();
                    setSelectedChopMarker(newMarkers.indexOf(pos));
                    return newMarkers;
                  });
                }}
              />`
);

fs.writeFileSync('src/App.tsx', app);
