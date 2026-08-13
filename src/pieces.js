// Archive of composed pieces. Add a new one by appending to PIECES below.

const firstPiece = `arrange(

  // --- Section 1: intro (8 cycles) ---
 [8, stack(
    note("<[cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [ef3, f3, g3, gs3, c4] [f3, g3, gs3, c4] [cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [f3, g3, gs3, c3, ef4] [f3, g3, gs3, c4]>").sound("piano").sustain(3).room(0.25).gain(saw.range(0.4, 0.9).slow(8)),
    note("c5 ef5 f5 g5 f5 ef5").sound("piano").room(0.25).gain(saw.range(0.3, 0.85).slow(8)),
    note("c6 bf5 c6 bf5 c6 bf5").sound("piano").room(0.25).gain(saw.range(0.2, 0.5).slow(8)),
  )],

  // --- Section 2: transition (4 cycles) ---
  [4, stack(
    note("<[cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [ef3, f3, g3, gs3, c4] [f3, g3, gs3, c4]>").sound("piano").sustain(3).room(0.25),
    // rising snare roll
    s("~ ~ rolandddr30_sd ~ ~ ~ rolandddr30_sd ~*2")
      .room(0.25)
      .gain(saw.range(0.1, 0.7).slow(4)),
    // white noise riser with filter sweep
    s("white*16")
      .gain(saw.range(0, 0.35).slow(4))
      .hpf(sine.range(500, 4000).slow(4)),
    // quiet pulse of the bass note to hint at what's coming
    note("<f3>*4").sound("gm_fx_atmosphere").gain(saw.range(0.1, 0.5).slow(4)),
  )],


  // --- Section 3: drop ---
  [8, stack(
    note("<[cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [ef3, f3, g3, gs3, c4] [f3, g3, gs3, c4] [cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [f3, g3, gs3, c3, ef4] [f3, g3, gs3, c4]>").sound("piano").sustain(3).room(0.25),
    note("<[f5,c5] [g5, ef5] [gs5, f5] [bf5, g5]>*4 <[f5,c5] [g5, ef5] [f5,c5] [[c6, gs5] [bf5, g5] [gs5, f5] [g5, ef5]]>").sound("piano").delay(0.25),
    note("<f3 f4 ~ f3 f4 f3 f3 f3>*8").sound("gm_lead_1_").delay(0.5).echo(3, 1/8, 0.8).sustain(2),
    note("<f2 f2 f2>*3 <c2 ef2 c2 [f2 f2 f2]>").sound("gm_synth_bass_1").sustain(0.2).lpf(800),
    s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~").bank("RolandTR909").gain("<0 0 0 0 0.5 0.5 0.5 0.5>").room(0.3),
    //note("<f3>*4").sound("gm_fx_atmosphere").gain(0.5).slow(4),
    // pickup: hats fade in only on the last cycle (cycle 8)
    s("hh*16").bank("RolandTR909").gain("<0 0 0 0 0 0 0 0.2>").swingBy(1/8, 8),
  )],

  // --- Section 4 ---
  [8, stack(
    note("<[cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [ef3, f3, g3, gs3, c4] [f3, g3, gs3, c4] [cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [f3, g3, gs3, c3, ef4] [f3, g3, gs3, c4]>").sound("piano").sustain(3).room(0.25),
    note("<[[c6, gs5] [bf5, g5] [c6, gs5] [bf5, g5]] [[gs5, ef5] [g5, c5] [gs5, ef5] [g5, c5]] [[g5, c5] [f5, bf4] [g5, c5] [f5, bf4]] [[f5,c5] [g5, ef5] [gs5, f5] [bf5, g5]]> <[ef6,c5] [c6, gs5] [c6, gs5] [[c6, gs5] [bf5, g5] [gs5, f5] [g5, ef5]]>").sound("piano").delay(0.25),
    note("<f3 f4 ~ f3 f4 f3 f3 f3>*8").sound("gm_electric_guitar_muted").delay(0.5).echo(3, 1/8, 0.8).sustain(2),
    note("<f2 f2 f2>*3 <c2 ef2 c2 [f2 f2 f2]>").sound("gm_synth_bass_1").sustain(0.2).lpf(800),
    note("<f3>*4").sound("gm_fx_atmosphere").gain(0.3).slow(4),
    // --- DJ Okawari style drumline ---
    s("bd ~ ~ ~ ~ ~ bd ~ ~ ~ bd ~ ~ ~ ~ ~").bank("RolandTR909").gain(0.9),
    s("~ ~ ~ ~ rim ~ ~ ~ ~ ~ ~ ~ rim ~ ~ ~").bank("RolandTR909").gain(0.6).room(0.2),
    s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~").bank("RolandTR909").gain(0.5).room(0.3),
    s("hh*16").bank("RolandTR909").gain("0.5 0.3 0.4 0.3".fast(4)).swingBy(1/8, 8).pan(sine.range(0.4, 0.6))
  )],

  [16, stack(
     note("<[cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [ef3, f3, g3, gs3, c4] [f3, g3, gs3, c4] [cs3, f3, gs3, bf3, c4] [bf3, ef3, gs3, bf3, c4] [f3, g3, gs3, c3, ef4] [f3, g3, gs3, c4]>").sound("piano").sustain(3).room(0.25),
     note("c5@4 bf4@2 gs4@2 g4@4 gs4@4 c5@4 bf4@2 gs4@2 ef5@4 c5@4").sound("gm_recorder").slow(8).sustain(5).lpf(1000),
     s("~ ~ ~ ~ cp ~ ~ ~ ~ ~ ~ ~ cp ~ ~ ~").bank("RolandTR909").gain("<0 0 0 0 0.5 0.5 0.5 0.5>").room(0.3),
  )]

)`;

export const PIECES = [
  { id: 'first-piece', name: 'First piece', code: firstPiece },
];
