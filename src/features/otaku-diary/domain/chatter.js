// What the guide says when the user taps her in the submarine café. Pure.

// Each line has the face she makes (`mood`), its voice clip (`voice`, an
// id in domain/voiceLines.js) and what she says. `say` is a
// function of what she knows about the user, so a line can mention their
// name or how much they have recorded; returning null means the line does
// not apply right now.
export const MOODS = ['happy', 'pout', 'wink', 'relaxed'];

const LINES = [
  { voice: 'chatWelcome', mood: 'happy', say: ({ nickname }) => `${nickname || '덕후'}, 어서 와! 오늘은 뭐 봤어?` },
  { voice: 'chatSofa', mood: 'relaxed', say: () => '여기 진짜 포근하지? 나는 저 소파 자리가 제일 좋아.' },
  { voice: 'chatMarshmallow', mood: 'wink', say: () => '핫초코엔 마시멜로를 꼭 띄워야 해. 이건 양보 못 해.' },
  { voice: 'chatBinge', mood: 'relaxed', say: () => '따뜻한 거 마시면서 애니 정주행… 이게 행복이지.' },
  { voice: 'chatFish', mood: 'happy', say: () => '창밖으로 물고기 지나가는 걸 보고 있으면 시간 가는 줄 몰라.' },
  { voice: 'chatQuiet', mood: 'relaxed', say: () => '깊이 내려갈수록 조용해져서 애니 보기 딱 좋아.' },
  { voice: 'chatCount', mood: 'happy', say: ({ count }) => (count > 0 ? `벌써 ${count}편이나 실었네. 대단한데?` : null) },
  { voice: 'chatEmpty', mood: 'pout', say: ({ count }) => (count === 0 ? '책장이 텅 비었어. 얼른 한 편 실으러 가자!' : null) },
  { voice: 'chatFull', mood: 'wink', say: () => '책장이 꽉 차는 날이 기대된다~' },
  { voice: 'chatPoke', mood: 'pout', say: () => '앗, 깜짝이야! 왜 자꾸 눌러~' },
];

// Picks a line that applies and differs from the one just said. `random` is
// a number in [0, 1), passed in so the choice can be tested. Returns
// { text, mood, voice }.
export function pickChatter(context, previousText, random) {
  const lines = LINES.map(({ say, ...line }) => ({ ...line, text: say(context) })).filter(
    (line) => line.text,
  );
  const fresh = lines.filter((line) => line.text !== previousText);
  const pool = fresh.length > 0 ? fresh : lines;
  return pool[Math.floor(random * pool.length)];
}
