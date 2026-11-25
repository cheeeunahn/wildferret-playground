// What the guide says out loud, in Japanese, for each spoken line. The
// on-screen text stays Korean; a line points here by its `voice` id. Pure.
//
// These are also the script the voice clips are generated from
// (scripts/kotori-voice.mjs), one clip per id. Lines whose Korean text
// includes the user's name or a number say a version without it.
export const VOICE_LINES = {
  // Onboarding
  greet: 'こんにちは！海の冒険へようこそ。あなたのこと、なんて呼べばいいかな？',
  nameOk: 'うん、いい名前だね！',
  search: 'まずは、前に見たアニメをひとつ探してみよっか。上の検索バーに、英語でタイトルを入れてみて。',
  dive: '見て。アニメを一本積むたびに、潜水艦が少しずつ深く潜っていくんだよ。',
  invite: '積んだアニメは、潜水艦の中にしまっておくね。潜水艦をタップして、中に入ってみない？',

  // First visit to the café
  tourWelcome: 'ここが潜水艦の中だよ。どう？ほっこりするでしょ？',
  tourBookshelf: '記録したアニメは、あの本棚に並べておくね。本棚をタップすると、リストが見られるよ。',
  tourStart: 'さあ、海の冒険を始めよう！',

  // Tapping her in the café
  chatWelcome: 'いらっしゃい！今日は何を見たの？',
  chatSofa: 'ここ、ほんとに落ち着くよね。わたしは、あのソファの席がいちばん好き。',
  chatMarshmallow: 'ホットチョコには、マシュマロを絶対浮かべなきゃ。これだけは譲れないよ。',
  chatBinge: 'あったかいものを飲みながら、アニメを一気見。これが幸せだよね。',
  chatFish: '窓の外を泳ぐお魚を見てると、時間を忘れちゃうんだ。',
  chatQuiet: '深く潜るほど静かになるから、アニメを見るのにぴったりなの。',
  chatCount: 'もうこんなに積んだんだ。すごいね！',
  chatEmpty: '本棚がからっぽだよ。早く一本、積みに行こう！',
  chatFull: '本棚がいっぱいになる日が、楽しみだな〜',
  chatPoke: 'わっ、びっくりした！なんで何回も押すの〜',
};
