const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

// Replace ScreenMode
code = code.replace(
  /export type ScreenMode = [\s\S]*?;/,
  `export type ScreenMode = 
  | 'SAMPLE' 
  | 'SAMPLE_RECORD' 
  | 'SEQUENCE' 
  | 'STEP_EDIT'
  | 'SONG' 
  | 'PAD_FX' 
  | 'FLEX_BEAT'
  | 'KNOB_FX' 
  | 'KNOB_FX_SELECT'
  | 'BROWSER' 
  | 'MENU_INPUT_CONFIG'
  | 'MENU_FADER'
  | 'MENU_TIME_CORRECT'
  | 'MENU_MIDI_CONFIG'
  | 'MENU_PROJECT';

export type SampleColumn1 = 'Trim' | 'Mix' | 'Amp Env';
export type SampleColumn2 = 'Tune' | 'Play';
export type SampleColumn3 = 'Filter' | 'Filt Env';
export type ActiveSampleColumn = 1 | 2 | 3;
`
);

// Remove SampleEditTab and ProgramEditTab
code = code.replace(/export type SampleEditTab = 'Trim' \| 'Chop' \| 'Program';/, '');
code = code.replace(/export type ProgramEditTab = 'Layer' \| 'Tune' \| 'Filter' \| 'Amp';/, '');

fs.writeFileSync('src/types.ts', code);
