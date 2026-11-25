// Generates 코토리's voice clips from the Japanese script in
// src/features/otaku-diary/domain/voiceLines.js.
//
// Needs a local AivisSpeech (or VOICEVOX-compatible) engine and ffmpeg.
// The engine is only used here, to make the files; the app just plays them.
//
//   node scripts/kotori-voice.mjs --list
//   node scripts/kotori-voice.mjs --speaker <style id> [--only greet,dive] [--out <dir>]
//
// --list     print the engine's voices and style ids
// --speaker  the style id to speak with
// --only     comma-separated line ids; default is every line
// --out      where the .mp3 files go; default is the app's voice folder
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { VOICE_LINES } from '../src/features/otaku-diary/domain/voiceLines.js';

const { values: args } = parseArgs({
  options: {
    list: { type: 'boolean' },
    speaker: { type: 'string' },
    only: { type: 'string' },
    out: { type: 'string' },
    engine: { type: 'string', default: 'http://127.0.0.1:10101' },
  },
});

async function engine(path, init) {
  const response = await fetch(`${args.engine}${path}`, init);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
  }
  return response;
}

if (args.list) {
  const speakers = await (await engine('/speakers')).json();
  for (const speaker of speakers) {
    for (const style of speaker.styles) {
      console.log(`${style.id}\t${speaker.name}\t${style.name}`);
    }
  }
  process.exit(0);
}

if (!args.speaker) {
  console.error('Pass --speaker <style id> (see --list).');
  process.exit(1);
}

const outDir = args.out ?? new URL('../src/features/otaku-diary/assets/voice/', import.meta.url).pathname;
const ids = args.only ? args.only.split(',') : Object.keys(VOICE_LINES);
const unknown = ids.filter((id) => !(id in VOICE_LINES));
if (unknown.length > 0) {
  console.error(`No such line: ${unknown.join(', ')}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const work = mkdtempSync(join(tmpdir(), 'kotori-voice-'));
try {
  for (const id of ids) {
    const params = new URLSearchParams({ text: VOICE_LINES[id], speaker: args.speaker });
    const query = await (await engine(`/audio_query?${params}`, { method: 'POST' })).json();
    const wav = await engine(`/synthesis?speaker=${args.speaker}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(query),
    });
    const wavPath = join(work, `${id}.wav`);
    writeFileSync(wavPath, Buffer.from(await wav.arrayBuffer()));
    // Mono speech: a small mp3 is plenty, and it plays everywhere.
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', wavPath,
      '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k',
      join(outDir, `${id}.mp3`),
    ]);
    console.log(`${id}.mp3`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
