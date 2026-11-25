// Art is looked up by file name so a missing file degrades to a drawn
// fallback instead of breaking the build.
const files = import.meta.glob('./*.{png,jpg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function assetUrl(name) {
  return files[`./${name}`] ?? null;
}

// Voice clips, by line id (see domain/voiceLines.js).
const voices = import.meta.glob('./voice/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function voiceUrl(id) {
  return voices[`./voice/${id}.mp3`] ?? null;
}
