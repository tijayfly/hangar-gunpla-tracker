// Current-price providers: 'dummy' placeholders, or live eBay UK listings with your own keys.
// Every result: { gbp, source, asOf, samples?, dummy? }

function hash(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

function dummyPrice(item, settings) {
  // placeholder based on what was paid (or the wishlist target)
  const base = (item.paid || item.targetPrice || 0) / (item.qty || 1);
  if (!base) return null;
  const r = hash(item.id + item.title);
  // Limited/event items drift higher; regular kits sit near retail.
  const factor = item.limited ? 1.0 + r * 1.6 : 0.8 + r * 0.6;
  const gbp = Math.max(1, Math.round(base * factor * (item.qty || 1)));
  return { gbp, source: 'Dummy data', asOf: new Date().toISOString(), dummy: true };
}

// ---- eBay Browse API (active listings, EBAY_GB) ----
// Errors carry a plain-English message; the HTTP status is kept at the end for reference.
function ebayError(stage, status) {
  let msg;
  if (stage === 'auth' && (status === 400 || status === 401)) msg = 'eBay rejected your keys. Use the Production App ID and Cert ID from the same keyset, and check the keyset is active';
  else if (status === 401) msg = 'eBay sign-in expired or was rejected';
  else if (status === 403) msg = 'eBay denied access. Your keyset may not have Browse API access yet';
  else if (status === 429) msg = 'eBay rate limit reached. Try again later';
  else if (status >= 500) msg = 'eBay is having problems right now. Try again later';
  else msg = `eBay ${stage === 'auth' ? 'sign-in' : 'search'} failed`;
  const e = new Error(`${msg} (HTTP ${status})`); e.status = status; return e;
}
async function ebayFetch(url, opts, stage) {
  let r;
  try { r = await fetch(url, opts); }
  catch (e) { throw new Error("Couldn't reach eBay. Check your internet connection"); }
  if (!r.ok) throw ebayError(stage, r.status);
  return r.json();
}
let token = null, tokenExp = 0, tokenKey = '';
async function ebayToken(appId, certId, fresh) {
  const key = appId + ':' + certId;
  if (!fresh && token && tokenKey === key && Date.now() < tokenExp - 60000) return token;
  const auth = Buffer.from(key).toString('base64');
  const j = await ebayFetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&scope=' + encodeURIComponent('https://api.ebay.com/oauth/api_scope'),
  }, 'auth');
  token = j.access_token; tokenExp = Date.now() + j.expires_in * 1000; tokenKey = key;
  return token;
}
async function ebaySearch(t, q) {
  const url = 'https://api.ebay.com/buy/browse/v1/item_summary/search?limit=50&q=' + encodeURIComponent(q) +
    '&filter=' + encodeURIComponent('buyingOptions:{FIXED_PRICE},conditions:{NEW},priceCurrency:GBP');
  return ebayFetch(url, { headers: { Authorization: `Bearer ${t}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB' } }, 'search');
}
// Settings → Test eBay keys: sign in afresh and run one search.
async function testEbayKeys(appId, certId) {
  if (!appId || !certId) return { ok: false, message: 'Enter both the App ID and the Cert ID first.' };
  try {
    const t = await ebayToken(appId.trim(), certId.trim(), true);
    const j = await ebaySearch(t, 'Gundam HG 1/144');
    return { ok: true, message: `Keys work: eBay UK returned ${j.total != null ? j.total.toLocaleString('en-GB') : (j.itemSummaries || []).length} listings for a test search.` };
  } catch (e) { return { ok: false, message: e.message }; }
}
function median(a) { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

async function ebayPrice(item, settings) {
  const t = await ebayToken(settings.ebayAppId.trim(), settings.ebayCertId.trim());
  const q = item.ebayQuery || item.title.replace(/[()]/g, ' ');
  const j = await ebaySearch(t, q);
  const prices = (j.itemSummaries || []).map((s) => parseFloat(s.price && s.price.value)).filter((n) => n > 0);
  if (prices.length < 3) return { gbp: null, source: 'eBay UK (too few listings)', asOf: new Date().toISOString(), samples: prices.length };
  // trim outliers (accessories, bundles)
  const s = prices.sort((a, b) => a - b); const cut = Math.floor(s.length * 0.15);
  const trimmed = s.slice(cut, s.length - cut);
  return { gbp: Math.round(median(trimmed) * (item.qty || 1)), source: 'eBay UK median asking price', asOf: new Date().toISOString(), samples: prices.length };
}

async function getCurrentPrice(item, settings) {
  if (settings.priceProvider === 'ebay' && settings.ebayAppId && settings.ebayCertId) return ebayPrice(item, settings);
  return dummyPrice(item, settings);
}

module.exports = { getCurrentPrice, dummyPrice, testEbayKeys };
