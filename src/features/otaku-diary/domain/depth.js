// Title count → depth. Pure: no React, no browser APIs.

// AniList formats that move the submarine. SPECIAL and MUSIC are recorded
// but do not count.
const DEPTH_FORMATS = new Set(['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA']);

export function countsForDepth(format) {
  return DEPTH_FORMATS.has(format);
}

// `from` is the first count inside the layer; `top`/`bottom` are metres.
export const LAYERS = [
  { id: 'surface', name: '표층', from: 0, top: 0, bottom: 200 },
  { id: 'twilight', name: '중층', from: 10, top: 200, bottom: 1000 },
  { id: 'midnight', name: '심해층', from: 50, top: 1000, bottom: 4000 },
  { id: 'abyss', name: '심연층', from: 200, top: 4000, bottom: 6000 },
  { id: 'hadal', name: '초심해층', from: 500, top: 6000, bottom: 11000 },
];

function layerIndexFor(count) {
  let index = 0;
  LAYERS.forEach((layer, i) => {
    if (count >= layer.from) index = i;
  });
  return index;
}

function metresFor(count, index) {
  const layer = LAYERS[index];
  const next = LAYERS[index + 1];
  if (!next) {
    // The trench has no next layer: approach the bottom without reaching it.
    const span = layer.bottom - layer.top;
    return layer.top + span * (1 - Math.exp(-(count - layer.from) / 500));
  }
  // The surface layer starts at count 0, which is 0m; 9 titles is 198m.
  const steps = next.from - layer.from + (index === 0 ? -1 : 0);
  const perTitle = (layer.bottom - layer.top) / (index === 0 ? 9 : steps);
  return layer.top + (count - layer.from) * perTitle;
}

export function depthFor(count) {
  const layerIndex = layerIndexFor(count);
  const layer = LAYERS[layerIndex];
  const nextLayer = LAYERS[layerIndex + 1] ?? null;
  return {
    count,
    metres: Math.round(metresFor(count, layerIndex)),
    layer,
    layerIndex,
    nextLayer,
    toNextLayer: nextLayer ? nextLayer.from - count : null,
  };
}

export function depthOfRecords(records) {
  return depthFor(records.filter((r) => r.countsForDepth).length);
}
