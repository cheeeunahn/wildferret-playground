// Title count → depth. Pure: no React, no browser APIs.

// AniList formats that move the submarine. SPECIAL and MUSIC are recorded
// but do not count.
const DEPTH_FORMATS = new Set(['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA']);

export function countsForDepth(format) {
  return DEPTH_FORMATS.has(format);
}

// `from` is the first count inside the layer; `top`/`bottom` are metres.
// Every title is 50m, so a layer starts at the count that reaches its top.
export const METRES_PER_TITLE = 50;

export const LAYERS = [
  { id: 'surface', name: '표층', from: 0, top: 0, bottom: 200 },
  { id: 'twilight', name: '중층', from: 4, top: 200, bottom: 1000 },
  { id: 'midnight', name: '심해층', from: 20, top: 1000, bottom: 4000 },
  { id: 'abyss', name: '심연층', from: 80, top: 4000, bottom: 6000 },
  { id: 'hadal', name: '초심해층', from: 120, top: 6000, bottom: 11000 },
];

// The trench bottom: 220 titles reach it, and more stay there.
const BOTTOM = LAYERS[LAYERS.length - 1].bottom;

function layerIndexFor(count) {
  let index = 0;
  LAYERS.forEach((layer, i) => {
    if (count >= layer.from) index = i;
  });
  return index;
}

function metresFor(count) {
  return Math.min(count * METRES_PER_TITLE, BOTTOM);
}

export function depthFor(count) {
  const layerIndex = layerIndexFor(count);
  const layer = LAYERS[layerIndex];
  const nextLayer = LAYERS[layerIndex + 1] ?? null;
  return {
    count,
    metres: metresFor(count),
    layer,
    layerIndex,
    nextLayer,
    toNextLayer: nextLayer ? nextLayer.from - count : null,
  };
}

export function depthOfRecords(records) {
  return depthFor(records.filter((r) => r.countsForDepth).length);
}
