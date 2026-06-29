const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

const newKits = `
  {
    name: 'House Kit',
    pads: [
      { name: 'House Kick', synthType: 'kick_909' },
      { name: 'House Snare', synthType: 'snare_909' },
      { name: 'House CH', synthType: 'hihat_closed' },
      { name: 'House OH', synthType: 'hihat_open' },
      { name: 'Punch Kick', synthType: 'kick_hard' },
      { name: 'House Clap', synthType: 'clap' },
      { name: 'Rim', synthType: 'rim' },
      { name: 'Ride', synthType: 'ride' },
      { name: 'Bass C', synthType: 'bass_c' },
      { name: 'Bass D', synthType: 'bass_d' },
      { name: 'Bass E', synthType: 'bass_e' },
      { name: 'Bass G', synthType: 'bass_g' },
      { name: 'Stab Cm', synthType: 'chord_cm' },
      { name: 'Stab Fm', synthType: 'chord_fm' },
      { name: 'Stab Gm', synthType: 'chord_gm' },
      { name: 'Stab Bb', synthType: 'chord_bb' },
    ],
  },
  {
    name: 'Drill Kit',
    pads: [
      { name: 'Slide 808', synthType: 'kick_deep' },
      { name: 'Drill Snare', synthType: 'snare' },
      { name: 'Drill Hat 1', synthType: 'hihat_closed' },
      { name: 'Drill Hat 2', synthType: 'hihat_open' },
      { name: 'Punch Kick', synthType: 'kick_hard' },
      { name: 'Counter Snr', synthType: 'clap' },
      { name: 'Perc', synthType: 'clave' },
      { name: 'Rim', synthType: 'rim' },
      { name: 'Glitch C', synthType: 'bass_c' },
      { name: 'Glitch D', synthType: 'bass_d' },
      { name: 'Glitch E', synthType: 'bass_e' },
      { name: 'Glitch G', synthType: 'bass_g' },
      { name: 'Dark Bell 1', synthType: 'chord_cm' },
      { name: 'Dark Bell 2', synthType: 'chord_fm' },
      { name: 'Dark Bell 3', synthType: 'chord_gm' },
      { name: 'Crash', synthType: 'crash' },
    ],
  },
  {
    name: 'Acoustic Kit',
    pads: [
      { name: 'Kick', synthType: 'kick_hard' },
      { name: 'Snare', synthType: 'snare' },
      { name: 'Hat Closed', synthType: 'hihat_closed' },
      { name: 'Hat Open', synthType: 'hihat_open' },
      { name: 'Kick Alt', synthType: 'kick_deep' },
      { name: 'Snare Alt', synthType: 'snare_909' },
      { name: 'Stick', synthType: 'clave' },
      { name: 'Rim', synthType: 'rim' },
      { name: 'Tom Floor', synthType: 'tom_low' },
      { name: 'Tom Mid', synthType: 'tom_mid' },
      { name: 'Tom High', synthType: 'tom_high' },
      { name: 'Cowbell', synthType: 'cowbell' },
      { name: 'Crash 1', synthType: 'crash' },
      { name: 'Crash 2', synthType: 'noise_hit' },
      { name: 'Ride', synthType: 'ride' },
      { name: 'Shaker', synthType: 'shaker' },
    ],
  },
`;

code = code.replace(/export const PRESET_KITS: PresetKit\[\] = \[/g, "export const PRESET_KITS: PresetKit[] = [\n" + newKits);

fs.writeFileSync('src/types.ts', code);
