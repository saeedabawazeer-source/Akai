const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/import SampleEditScreen from '.\/screens\/SampleEditScreen';/, "import SampleScreen from './screens/SampleScreen';");

const oldRender = /<SampleEditScreen[\s\S]*?onAddManualChop=\{\(pos\) => \{[\s\S]*?\}\}\n              \/>/;

const newRender = `<SampleScreen
                audioBuffer={audioBuffer}
                activePad={activePad || 1}
                padBank={padBank}
                padAssignments={padAssignments}
                sampleCol1={sampleCol1}
                sampleCol2={sampleCol2}
                sampleCol3={sampleCol3}
                activeSampleCol={activeSampleCol}
                padSettings={allPadSettings[(activePad || 1) - 1] || DEFAULT_PAD_SETTINGS}
                trimStart={trimStart}
                trimEnd={trimEnd}
                loopStart={trimStart}
                chopMode={chopMode}
                chopType={chopType}
                chopMarkers={chopMarkers}
                selectedChopMarker={selectedChopMarker}
                playMode={playMode}
                sixteenLevels={sixteenLevels}
                sixteenLevelsType={'Velocity'}
                isReversed={playMode === 'LOOP' && false /* update this when reversed logic added */}
                onWaveformClick={(pos) => {
                  if (chopMode) {
                    setChopMarkers(prev => {
                      const newMarkers = [...prev, pos].sort();
                      setSelectedChopMarker(newMarkers.indexOf(pos));
                      return newMarkers;
                    });
                  }
                }}
              />`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/App.tsx', code);
