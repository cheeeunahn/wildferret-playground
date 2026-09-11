const firstPiece = `// ============================================================
//  Fm groove - piano theme / drop / break / theme reprise
//  Key center: F minor
// ============================================================

// --- Reusable parts (defined once, referenced in sections) ---

// The 8-cycle left-hand chord cluster that runs under everything
const chords =
  note("<[cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [ef3, f3, g3, gs3, c4] [f3, g3, gs3, c4] [cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [f3, g3, gs3, c3, ef4] [f3, g3, gs3, c4]>")
    .sound("piano").sustain(3).room(0.3);

// Right-hand piano riff used in the drop / theme sections
const rhKeys =
  note("<[[c6, gs5] [bf5, g5] [c6, gs5] [bf5, g5]] [[gs5, ef5] [g5, c5] [gs5, ef5] [g5, c5]] [[g5, c5] [f5, bf4] [g5, c5] [f5, bf4]] [[f5,c5] [g5, ef5] [gs5, f5] [bf5, g5]]> <[ef6,c5] [c6, gs5] [c6, gs5] [[c6, gs5] [bf5, g5] [gs5, f5] [g5, ef5]]>")
    .sound("piano").delay(0.25);

const bass =
  note("<f2 f2 f2>*3 <c2 ef2 c2 [f2 f2 f2]>")
    .sound("gm_synth_bass_1").sustain(0.3).lpf(1000).gain(1.2);

const atmos =
  note("<f3>*4").sound("gm_fx_atmosphere").lpf(500).gain(1.3);

// DJ Okawari style drumline
const drums = stack(
  s("bd ~ ~ ~ ~ ~ bd ~ ~ ~ bd ~ ~ ~ ~ ~").bank("RolandTR909").gain(0.9),
  s("~ ~ ~ ~ rim ~ ~ ~ ~ ~ ~ ~ rim ~ ~ ~").bank("RolandTR909").gain(0.6).room(0.2),
  s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~").bank("RolandTR909").gain(0.5).room(0.3),
  s("hh*16").bank("RolandTR909").gain("0.5 0.3 0.4 0.3".fast(4)).swingBy(1/8, 8).pan(sine.range(0.4, 0.6)).room(0.2),
);

// The full-band theme block, reused for Section 4 and its reprise
const theme = stack(
  chords,
  rhKeys,
  note("<f3 f4 ~ f3 f4 f3 f3 f3>*8").sound("gm_electric_guitar_muted").delay(0.5).echo(3, 1/8, 0.8).sustain(2),
  bass,
  atmos.gain(0.5).slow(4),
  drums,
);


arrange(

  // --- Section 1: intro (8 cycles) ---
  [8, stack(
    chords.gain(saw.range(0.4, 0.9).slow(8)),
    note("c5 ef5 f5 g5 f5 ef5").sound("piano").room(0.25).gain(saw.range(0.3, 0.85).slow(8)),
    note("c6 bf5 c6 bf5 c6 bf5").sound("piano").room(0.25).gain(saw.range(0.2, 0.5).slow(8)),
  )],

  // --- Section 2: transition / riser (4 cycles) ---
  [4, stack(
    note("<[cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [ef3, f3, g3, gs3, c4] [f3, g3, gs3, c4]>").sound("piano").sustain(3).room(0.25),
    s("~ ~ rolandddr30_sd ~ ~ ~ rolandddr30_sd ~*2").room(0.25).gain(saw.range(0.1, 0.7).slow(4)),
    s("white*16").gain(saw.range(0, 0.35).slow(4)).hpf(sine.range(500, 4000).slow(4)),
    note("<f3>*4").sound("gm_fx_atmosphere").gain(saw.range(0.1, 0.5).slow(4)),
  )],

  // --- Section 3: drop ---
  [8, stack(
    chords,
    note("<[f5,c5] [g5, ef5] [gs5, f5] [bf5, g5]>*4 <[f5,c5] [g5, ef5] [f5,c5] [[c6, gs5] [bf5, g5] [gs5, f5] [g5, ef5]]>").sound("piano").delay(0.25),
    bass,
    s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~").bank("RolandTR909").gain("<0 0 0 0 0.5 0.5 0.5 0.5>").room(0.3),
    // pickup: hats fade in only on the last cycle
    s("hh*16").bank("RolandTR909").gain("<0 0 0 0 0 0 0 0.2>").swingBy(1/8, 8),
  )],

  // --- Section 4: full theme ---
  [8, theme],

  // --- Section 5: BREAK (8 cycles) ---
  // Drums drop out, recorder melody takes the lead, then the groove
  // rebuilds over the second half to lead back into the theme.
  [8, stack(
    // chords soften for the break, swell back up over the last few cycles
    chords.gain("<0.45 0.45 0.45 0.5 0.55 0.6 0.7 0.85>"),

    // lead recorder melody - your original 8-cycle phrase (unchanged)
    note("c5@4 bf4@2 gs4@2 g4@4 gs4@4 c5@4 bf4@2 gs4@2 ef5@4 c5@4")
      .sound("gm_recorder").slow(8).sustain(3)
      .lpf(sine.range(900, 1800).slow(8)).gain(0.7).room(1.5),

    // held atmosphere pad throughout the break
    atmos.gain(0.4).slow(4),

    note("f6 ~ c6 ~ f6 ~ c6 ~ f6 ~ c6 ~ ef6 ~ bf5 ~").sound("glockenspiel").gain(3).sustain(2).delay(0.5).room(0.5).slow(4),

    note("~ ~ ~ ~ [f5,c5] [g5, ef5] [gs5, f5] [bf5, g5]")
      .sound("piano").delay(0.25).gain("<0 0 0 0 0 0 0 1>"),

    s("white*16").gain(saw.range(0, 0.50).slow(8)).hpf(sine.range(500, 4000).slow(8)),

    // --- second half: quietly rebuild the groove ---
    // claps come back at cycle 3, bass re-enters at cycle 5
    s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~").bank("RolandTR909")
      .gain("<0 0 0.35 0.4 0.45 0.5 0.5 0.5>").room(0.3),

    bass.gain("<0 0 0 0 0.5 0.7 0.9 1>"),


    // rim tick sneaks in for the last 3 cycles
    s("~ ~ ~ ~ rim ~ ~ ~ ~ ~ ~ ~ rim ~ ~ ~").bank("RolandTR909")
      .gain("<0 0 0 0 0 0.5 0.5 0.6>").room(0.3),

    // hats swell in over the final 2 cycles as a pickup into Section 4
    s("hh*16").bank("RolandTR909")
      .gain("<0 0 0 0 0 0 0.25 0.4>")
      .swingBy(1/8, 8).pan(sine.range(0.4, 0.6)),
  )],

  // --- Section 4 reprise: theme returns in full ---
  [16, stack(
    theme, 
    note("f6 ~ c6 ~ f6 ~ c6 ~ f6 ~ c6 ~ ef6 ~ bf5 ~").sound("glockenspiel").gain(3).sustain(2).delay(0.5).room(0.5).slow(4),
    note("f3 ~ ~ ~ ~ ~ f3 ~ ~ ~ f3 ~ ~ ~ ~ ~")
        .sound("gm_pizzicato_strings").delay(0.25).lpf(700),
  )],

  // --- Section 1 reprise: intro theme returns to close (8 cycles) ---
  // Same figure as the opening, fading out to end the piece.
  [8, stack(
    chords.gain(saw.range(0.9, 0.3).slow(8)),
    note("c5 ef5 f5 g5 f5 ef5").sound("piano").room(0.25).gain(saw.range(0.85, 0).slow(8)),
    note("c6 bf5 c6 bf5 c6 bf5").sound("piano").room(0.25).gain(saw.range(0.5, 0).slow(8)),
  )],

)`;

export default {
  id: 'first-piece',
  name: 'something in F minor',
  code: firstPiece,
};
