// RRP lookup helpers: turn an English kit name into a Japanese retailer search, and rank results.
// The actual page loading happens in main.js (hidden browser window on biccamera.com).

// Order matters: longer phrases first.
const DICT = [
  ['perfect grade unleashed', 'PG UNLEASHED'], ['pg unleashed', 'PG UNLEASHED'],
  ['entry grade', 'ENTRY GRADE'], ['full mechanics', 'FULL MECHANICS'], ['mega size model', 'メガサイズモデル'], ['mega size', 'メガサイズモデル'],
  ['real grade', 'RG'], ['master grade', 'MG'], ['high grade', 'HG'], ['perfect grade', 'PG'],
  ['gundam base limited', 'ガンダムベース限定'], ['the gundam base', 'ガンダムベース'], ['gundam base color', 'ガンダムベースカラー'], ['gundam base', 'ガンダムベース'],
  ['gundam factory yokohama', 'GUNDAM FACTORY YOKOHAMA'], ['side-f', 'SIDE-F'],
  ["char's", 'シャア専用'], ['char aznable', 'シャア'], ['commander type', 'シャア専用'],
  ['military police', '軍警'], ['white gundam', '白いガンダム'], ['red gundam', '赤いガンダム'],
  ['unicorn', 'ユニコーンガンダム'], ['banshee', 'バンシィ'], ['phenex', 'フェネクス'], ['sinanju', 'シナンジュ'],
  ['aerial', 'エアリアル'], ['calibarn', 'キャリバーン'], ['lfrith', 'ルブリス'],
  ['zaku iii', 'ザクIII'], ['zaku ii', 'ザクII'], ['zaku', 'ザク'], ["z'gok", 'ズゴック'], ['zgok', 'ズゴック'], ['gouf', 'グフ'], ['dom', 'ドム'], ['gelgoog', 'ゲルググ'],
  ['guntank', 'ガンタンク'], ['guncannon', 'ガンキャノン'], ['gm', 'ジム'],
  ['qubeley', 'キュベレイ'], ['psycho gundam', 'サイコガンダム'], ['hyaku shiki', '百式'], ['hyaku-shiki', '百式'],
  ['sazabi', 'サザビー'], ['nu gundam', 'νガンダム'], ['ν gundam', 'νガンダム'], ['hi-nu', 'Hi-νガンダム'],
  ['strike freedom', 'ストライクフリーダム'], ['freedom', 'フリーダム'], ['justice', 'ジャスティス'], ['strike', 'ストライク'], ['raider', 'レイダー'], ['calamity', 'カラミティ'], ['forbidden', 'フォビドゥン'], ['aegis', 'イージス'], ['destiny', 'デスティニー'],
  ['wing gundam zero', 'ウイングガンダムゼロ'], ['wing', 'ウイング'], ['deathscythe', 'デスサイズ'], ['exia', 'エクシア'], ['barbatos', 'バルバトス'],
  ['turn a', 'ターンエー'], ['nobell', 'ノーベル'], ['rose', 'ローズ'], ['shining', 'シャイニング'], ['god gundam', 'ゴッドガンダム'], ['burning', 'バーニング'],
  ['amazing red warrior', 'アメイジングレッドウォーリア'], ['lah gundam', 'ラーガンダム'],
  ['age-1', 'AGE-1'], ['normal', 'ノーマル'], ['revive', 'REVIVE'],
  ['evangelion unit-01', 'エヴァンゲリオン初号機'], ['eva-01', 'エヴァンゲリオン初号機'], ['evangelion', 'エヴァンゲリオン'],
  ['ingram', 'イングラム'], ['valkyrie', 'バルキリー'],
  ['gquuuuuux', 'GQuuuuuuX'], ['gundam', 'ガンダム'],
  ['destroy mode', 'デストロイモード'], ['unicorn mode', 'ユニコーンモード'], ['gold coating', 'ゴールドコーティング'], ['clear color', 'クリアカラー'],
  ['ecopla', 'エコプラ'], ['titanium finish', 'チタニウムフィニッシュ'],
];
const DROP = /\b(bandai|gunpla|model kit|kit|limited|exclusive|edition|the|ver\.?\s*(?=[a-z])|version)\b/gi;
const ACCESSORY = /デカール|用\b|専用ベース|ウェポン|パーツ|エフェクト|LED|アクションベース|ディスプレイ|カスタムセット|塗料|マーカー|ニッパー|フィギュア|ROBOT魂|GUNDAM UNIVERSE|一番くじ|クロス|ミキシマイズ|超合金|食玩|ガシャポン/;

function nfkc(s) { return String(s || '').normalize('NFKC'); }

function buildQueries(item) {
  let t = nfkc(item.title).replace(/[()\[\]【】「」]/g, ' ').replace(/×\d+/g, ' ');
  let jp = ' ' + t.toLowerCase() + ' ';
  for (const [en, ja] of DICT) {
    const re = new RegExp('(^|[^a-z])' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^a-z])', 'gi');
    jp = jp.replace(re, `$1 ${ja} `);
  }
  jp = jp.replace(DROP, ' ').replace(/\s+/g, ' ').trim();
  // restore upper-case codes
  jp = jp.replace(/\b(hguc|hgfc|hgcc|hgbf|hg|rg|mg|pg|eg|sd|ag)\b/g, (m) => m.toUpperCase()).replace(/\b(rx|ms|msm|msn|amx|mrx|gat|zgmf|xvx)-/gi, (m) => m.toUpperCase());
  const codes = (nfkc(item.title).match(/\b[A-Z]{1,5}-?\d{1,3}[A-Z0-9/-]*\b/g) || []);
  const grade = (jp.match(/^(PG UNLEASHED|ENTRY GRADE|FULL MECHANICS|メガサイズモデル|HGUC|HGFC|HGCC|HGBF|HG|RG|MG|PG|EG|SD)/) || [''])[0];
  const short = [grade, ...codes, ...jp.split(' ').filter((w) => /[぀-ヿ一-鿿]/.test(w)).slice(0, 2)].filter(Boolean).join(' ');
  return [...new Set([jp, short].filter((q) => q && q.length > 2))];
}

function scoreResult(item, title) {
  const T = nfkc(title).toUpperCase();
  const I = nfkc(item.title).toUpperCase();
  let s = 0;
  const g = item.grade;
  const gradeRe = { PG: /\bPG\b|PERFECT GRADE/, MG: /\bMG\b|MASTER GRADE/, RG: /\bRG\b|REAL GRADE/, HG: /\bHG(UC|FC|CC|BF|CE|AC)?\b/, EG: /ENTRY GRADE|\bEG\b/, SD: /\bSD|BB戦士/, FM: /FULL MECHANICS/, Mega: /メガサイズ/ };
  if (gradeRe[g] && gradeRe[g].test(T)) s += 4;
  for (const [k, re] of Object.entries(gradeRe)) if (k !== g && re.test(T) && !(gradeRe[g] && gradeRe[g].test(T))) s -= 4;
  for (const c of (I.match(/\b[A-Z]{1,5}-?\d{1,3}[A-Z0-9/-]*\b/g) || [])) if (T.includes(c)) s += 3;
  const sc = (I.match(/1\/\d+/) || [item.scale || ''])[0]; if (sc && T.includes(sc)) s += 1;
  const jpTerms = buildQueries(item)[0].split(' ').filter((w) => /[぀-ヿ一-鿿]/.test(w));
  for (const w of jpTerms) if (T.includes(w.toUpperCase())) s += 2;
  if (ACCESSORY.test(title) && !ACCESSORY.test(item.title)) s -= 6;
  if (/DX|セット|SET\b/.test(T) && !/\bSET\b|&|DX|×\d|DOCK/.test(I)) s -= 3;
  if (/VER\.?\s?(\d\.\d)/.test(I)) { const v = I.match(/VER\.?\s?(\d\.\d)/)[1]; s += T.replace(/．/g, '.').includes(v) ? 2 : -2; }
  return s;
}

function extractPrice(html) {
  const m = html.match(/メーカー希望小売価格[\s\S]{0,80}?([\d,]+)\s*円\s*[(（]税込[)）]/) || html.match(/メーカー価格[\s\S]{0,60}?([\d,]+)\s*円\s*[(（]税込[)）]/);
  const d = html.match(/メーカー発売日[\s\S]{0,60}?(\d{4})年(\d{1,2})月/);
  return { priceJpy: m ? parseInt(m[1].replace(/,/g, ''), 10) : null, released: d ? `${d[1]}-${d[2].padStart(2, '0')}` : null };
}

module.exports = { buildQueries, scoreResult, extractPrice, ACCESSORY };
