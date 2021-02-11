
const ENEMY_DATA = [
{ image:"maou", name:"魔王クソゲム", hp:100, exp:300, atk:30, def:30 },
{ image:"sura", name:"スラね", hp:3, exp:1, atk:1, def:0 },
{ image:"sura", name:"スラた", hp:4, exp:2, atk:2, def:0 },
{ image:"sura", name:"スラみ", hp:5, exp:3, atk:2, def:1 },
{ image:"sura", name:"スラこ", hp:8, exp:4, atk:3, def:1 },
{ image:"sura", name:"スラのり", hp:8, exp:5, atk:3, def:2 },
{ image:"sura", name:"スラきち", hp:10, exp:6, atk:4, def:2 },
{ image:"sura", name:"スラまる", hp:10, exp:7, atk:4, def:3 },
{ image:"sura", name:"スラたろう", hp:12, exp:8, atk:4, def:3 },
{ image:"sura", name:"スラえ", hp:13, exp:9, atk:4, def:4 },
{ image:"sura", name:"スラ王", hp:15, exp:10, atk:4, def:4 },
{ image:"buta", name:"ブタし", hp:18, exp:12, atk:6, def:4 },
{ image:"buta", name:"ブタよし", hp:20, exp:15, atk:8, def:5 },
{ image:"buta", name:"ブタき", hp:22, exp:18, atk:9, def:6 },
{ image:"buta", name:"ブタすえ", hp:23, exp:20, atk:9, def:8 },
{ image:"buta", name:"ブタむね", hp:25, exp:23, atk:10, def:9 },
{ image:"buta", name:"ブタよ", hp:28, exp:25, atk:10, def:10 },
{ image:"buta", name:"ブタしげ", hp:30, exp:38, atk:12, def:10 },
{ image:"buta", name:"ブタる", hp:32, exp:40, atk:13, def:11 },
{ image:"buta", name:"ブタえみ", hp:33, exp:45, atk:15, def:12 },
{ image:"buta", name:"ブタ王", hp:35, exp:50, atk:15, def:15 },
{ image:"iwao", name:"イワお", hp:38, exp:58, atk:16, def:16 },
{ image:"iwao", name:"イワみね", hp:39, exp:60, atk:17, def:17 },
{ image:"iwao", name:"イワざき", hp:40, exp:64, atk:18, def:18 },
{ image:"iwao", name:"イワな", hp:45, exp:70, atk:19, def:19 },
{ image:"iwao", name:"イワねぇ", hp:48, exp:72, atk:20, def:20 },
{ image:"iwao", name:"イワにぃ", hp:50, exp:80, atk:21, def:21 },
{ image:"iwao", name:"イワじぃ", hp:55, exp:85, atk:22, def:22 },
{ image:"iwao", name:"イワばぁ", hp:60, exp:90, atk:23, def:23 },
{ image:"iwao", name:"イワ王", hp:75, exp:100, atk:25, def:25 },

];
const SPEED_DATA = [
  {text: 'x1', speed: 1000, needLevel: 1},
  {text: 'x1.5', speed: 750, needLevel: 10},
  {text: 'x2', speed: 500, needLevel: 20},
  {text: 'x4', speed: 250, needLevel: 30},
  {text: 'x8', speed: 125, needLevel: 40},
  {text: 'x16', speed: 60, needLevel: 50}
];

const COLOR = {
  red:'#F86', blue: '#8AF', green: '#8F6',yellow: '#FF6', white: '#FFF', black: '#000',
}

const OBJECT_Y = { top:40, topNext: 70, bottom:930, need:880,}
const OBJECT_DATA = {
    label: {
      hp: { x:80, y:OBJECT_Y.bottom, fill: COLOR.white, fontSize: 27, fontWeight: 600 },
      atk: { x:200, y:OBJECT_Y.bottom, fill: COLOR.white, fontSize: 27, fontWeight: 600 },
      def: { x:320, y:OBJECT_Y.bottom, fill: COLOR.white, fontSize: 27, fontWeight: 600 },
      exp: { x:450, y:OBJECT_Y.bottom, fill: COLOR.white, fontSize: 27, fontWeight: 600 },
      floor: { x:80, y:OBJECT_Y.top, fill: COLOR.white, fontSize: 27, fontWeight: 900 },
      level: { x:80, y:OBJECT_Y.topNext, fill: COLOR.white, fontSize: 27, fontWeight: 900 },
      kill: { x:240, y:OBJECT_Y.top, fill: COLOR.white, fontSize: 27, fontWeight: 900 },
      death: { x:240, y:OBJECT_Y.topNext, fill: COLOR.white, fontSize: 27, fontWeight: 900 },
      needHpExp: { x:80, y:OBJECT_Y.need, fill: COLOR.black, fontSize: 15, fontWeight: 300 },
      needAtkExp: { x:200, y:OBJECT_Y.need, fill: COLOR.black, fontSize: 15, fontWeight: 300 },
      needDefExp: { x:320, y:OBJECT_Y.need, fill: COLOR.black, fontSize: 15, fontWeight: 300 },
    },
    shape: {
    },
    sprite: {
      player: {x: -160, y:560 },
      enemy: {x: 700, y:560 }
    }
}

const LEVEL_UP_DATA = {
  needHpExp: { value: 10, key:'hp' },
  needAtkExp: { value: 1, key:'atk' },
  needDefExp: { value: 1, key:'def' }
}

const SEPARATION = `========================================`;
const LOG = [
  SEPARATION,
  `<color:${COLOR.red}>[画面上部]</color>現在の状態が確認出来る。`,
  `<color:${COLOR.red}>[画面右上]</color>[x1]で戦闘速度を変更出来る。レベルによって制限がある。`,
  `<color:${COLOR.red}>[画面下部]</color>[出撃]で魔王を倒す旅に出発する。`,
  `<color:${COLOR.red}>[画面下部]</color>[◯EXPで強化]でステータスを強化出来る。`,
  `<color:${COLOR.red}>[画面下部]</color>あなたのステータスが確認出来る。`,
  SEPARATION,
  `<color:${COLOR.blue}>[Tips]</color>戦闘は自動で進む。とりあえず[出撃]を押してみよう。`,
  `<color:${COLOR.blue}>[Tips]</color>HPが0以下になっても、1Fに戻される以外デメリットはない。`,
  `<color:${COLOR.blue}>[Tips]</color>敵と同時にHPが0以下になると、経験値を得ることは出来ない。`,
  `<color:${COLOR.blue}>[Tips]</color>リロードしたらデータが消えるので気をつけてください。`,
  SEPARATION,
];

const ENCOUNT_TEXT = [
  'ギャハハッ！一緒に遊ぼうよ！',
  'ニンゲン…コロス…',
  '推して参る！',
  '何者だテメー！？',
  'かかってこいや！',
  'た、戦わなきゃ…',
  '曲者ーっ',
  'いらっしゃいませ～',
  '失礼しま～す',
  'ついてね～っ！',
  '逃げるのも、あり？',
  '負けねーぞコラァ！',
  'オホホ！勝てるつもりかしら？',
  'てき が あらわれた！',
  'ココから先には行かせん！',
  'さ～て、本気を出しますかね',
  'てか今ヒマ？',
  'お前だけは逃さん！',
  'この勝負の結末は見えた！',
];
const WIN_TEXT = [
  '俺、なんかやっちゃいました？',
  'ありがとうございました～',
  'おととい来やがれ！',
  'あっ、すみません',
  '弱し…',
  'やったよ、母さん！',
  '今日もまた生き残れた…',
  '帰ってテレビ見よ～っと',
  'えっ！？勝てちゃったの！？',
  '帰ってくれ～！',
  'このように倒すのだ',
  '恐るるに足らず！',
  '敗北を知りたい',
  'クリティカルヒット！',
  'このまま走り続けよう、どこまでも',
];
const LOSE_TEXT = [
  'うそ～ん',
  'ぎゃぽぴー！',
  '痛っ',
  'お疲れ様で～す',
  'また来週！',
  '呪ってやるー！',
  '帰りにスーパー寄るか～',
  'さよなら さよなら さよなら',
  'ﾏｹﾁｬｯﾀﾖ',
  '試合には負けたが、勝負には勝った！',
  '一回休み',
  'コレって労災出る？',
  'こ、腰が…',
  'ごめん、よそ見してた',
  'やな感じ～！',
];

const getRandomArrIndex = (arr) => {
  return arr[Math.floor(Math.random()*arr.length)];
}
const getEncountText = () => {
  return getRandomArrIndex(ENCOUNT_TEXT);
}
const getWinText = () => {
  return getRandomArrIndex(WIN_TEXT);
}
const getLoseText = () => {
  return getRandomArrIndex(LOSE_TEXT);
}