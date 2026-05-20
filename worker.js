/**
 * Cloudflare Worker — BaseCore x402 Payment Gateway + KV State
 * CDP Ed25519 JWT Authentication + İki Aşamalı Verify/Settle Akışı
 *
 * Cloudflare Secrets:
 *   CDP_API_KEY    → CDP Key ID (UUID)
 *   CDP_KEY_SECRET → CDP Ed25519 Private Key (base64, ~88 karakter)
 *   FEE_WALLET     → Ödeme alacak cüzdan adresi (0x...)
 *
 * Cloudflare Bindings:
 *   BASECORE_KV    → KV Namespace (kullanıcı state verisi)
 *
 * Endpoints:
 *   POST /         → x402 ödeme (verify + settle)
 *   GET  /state    → kullanıcı state oku  (?addr=0x...)
 *   POST /state    → kullanıcı state yaz  (body: { address, xp, level, streak, refs, tasks })
 */

// ── Constants ────────────────────────────────────────────────────────────────
const CDP_BASE_URL  = 'https://api.cdp.coinbase.com/platform/v2/x402';
const CDP_VERIFY    = CDP_BASE_URL + '/verify';
const CDP_SETTLE    = CDP_BASE_URL + '/settle';
const USDC_BASE     = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const NETWORK       = 'base';
const NETWORK_CAIP2 = 'eip155:8453';
const PRICE_ATOMIC  = '50000'; // 0.05 USDC
const TIMEOUT_SEC   = 300;
const KV_PREFIX     = 'user:'; // basexp ile çakışmasın

const ALLOWED_ORIGINS = [
  'https://basecore.fun',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
];

// ── CORS ─────────────────────────────────────────────────────────────────────
function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':   origin,
    'Access-Control-Allow-Methods':  'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':  'Content-Type, X-PAYMENT, X-Payment, x-payment, PAYMENT-SIGNATURE, Authorization',
    'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE',
    'Vary': 'Origin',
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonRes(status, body, extraHeaders = {}, requestOrigin = '*') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function isValidAddress(addr) {
  return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function base64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64Decode(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── CDP Ed25519 JWT Builder ───────────────────────────────────────────────────
async function buildCdpJwt(keyName, keySecretB64, httpMethod, requestPath) {
  const decoded = base64Decode(keySecretB64);

  let seed;
  if (decoded.length === 64)      seed = decoded.slice(0, 32);
  else if (decoded.length === 32) seed = decoded;
  else throw new Error(`Invalid Ed25519 key length: ${decoded.length} bytes`);

  // PKCS8 wrapper for Web Crypto Ed25519
  const pkcs8Header = new Uint8Array([
    0x30, 0x2e,
    0x02, 0x01, 0x00,
    0x30, 0x05,
      0x06, 0x03, 0x2b, 0x65, 0x70,
    0x04, 0x22,
      0x04, 0x20,
  ]);
  const pkcs8Key = new Uint8Array(pkcs8Header.length + seed.length);
  pkcs8Key.set(pkcs8Header);
  pkcs8Key.set(seed, pkcs8Header.length);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8Key,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'EdDSA', typ: 'JWT', kid: keyName, nonce };
  const payload = {
    sub: keyName,
    iss: 'cdp',
    aud: ['cdp_service'],
    nbf: now,
    exp: now + 120,
    uri: `${httpMethod} api.cdp.coinbase.com${requestPath}`,
  };

  const encodedHeader  = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const message        = `${encodedHeader}.${encodedPayload}`;

  const sig = await crypto.subtle.sign({ name: 'Ed25519' }, cryptoKey, new TextEncoder().encode(message));
  return `${message}.${base64url(sig)}`;
}

// ── CDP Request ───────────────────────────────────────────────────────────────
async function cdpRequest(endpoint, body, keyName, keySecretB64) {
  const path = new URL(endpoint).pathname;
  const jwt  = await buildCdpJwt(keyName, keySecretB64, 'POST', path);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── GET /state — KV'den kullanıcı state oku ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
async function handleGetState(request, env, origin) {
  const addr = new URL(request.url).searchParams.get('addr');

  if (!addr || !isValidAddress(addr)) {
    return jsonRes(400, { error: 'Invalid or missing address' }, {}, origin);
  }

  const data = await env.BASECORE_KV.get(KV_PREFIX + addr.toLowerCase());

  if (!data) {
    // Yeni kullanıcı — varsayılan state
    return jsonRes(200, { xp: 0, level: 1, streak: 0, refs: 0, tasks: {} }, {}, origin);
  }

  try {
    return jsonRes(200, JSON.parse(data), {}, origin);
  } catch {
    return jsonRes(200, { xp: 0, level: 1, streak: 0, refs: 0, tasks: {} }, {}, origin);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POST /state — KV'ye kullanıcı state yaz ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
async function handlePostState(request, env, origin) {
  let body;
  try { body = await request.json(); }
  catch { return jsonRes(400, { error: 'Invalid JSON body' }, {}, origin); }

  const { address, xp, level, streak, refs, tasks } = body;

  if (!address || !isValidAddress(address)) {
    return jsonRes(400, { error: 'Invalid or missing address' }, {}, origin);
  }

  const state = {
    xp:        typeof xp     === 'number' ? Math.max(0, Math.floor(xp))     : 0,
    level:     typeof level  === 'number' ? Math.max(1, Math.floor(level))  : 1,
    streak:    typeof streak === 'number' ? Math.max(0, Math.floor(streak)) : 0,
    refs:      typeof refs   === 'number' ? Math.max(0, Math.floor(refs))   : 0,
    tasks:     tasks && typeof tasks === 'object' ? tasks : {},
    updatedAt: new Date().toISOString(),
  };

  // 90 gün TTL — inaktif kullanıcılar otomatik silinir
  await env.BASECORE_KV.put(
    KV_PREFIX + address.toLowerCase(),
    JSON.stringify(state),
    { expirationTtl: 60 * 60 * 24 * 90 }
  );

  return jsonRes(200, { success: true }, {}, origin);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── POST / — x402 Payment (verify + settle) ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
async function handlePayment(request, env, origin) {
  const payTo        = env.FEE_WALLET || '0x356473fc86c257B05f7CaCF5FB496C4Fd93FbF94';
  const cdpKeyName   = env.CDP_API_KEY;
  const cdpKeySecret = env.CDP_KEY_SECRET || env.CDP_API_SECRET;

  if (!cdpKeyName || !cdpKeySecret) {
    console.error('CDP credentials missing!');
    return jsonRes(500, { error: 'Server misconfiguration: CDP credentials missing' }, {}, origin);
  }

  const paymentRequirements = {
    scheme:            'exact',
    network:           NETWORK,
    maxAmountRequired: PRICE_ATOMIC,
    resource:          new URL(request.url).pathname,
    description:       'BaseCore platform access fee',
    mimeType:          'application/json',
    payTo,
    maxTimeoutSeconds: TIMEOUT_SEC,
    asset:             USDC_BASE,
    extra: { name: 'USD Coin', version: '2', decimals: 6 },
  };

  const paymentHeader =
    request.headers.get('X-PAYMENT')         ||
    request.headers.get('X-Payment')         ||
    request.headers.get('x-payment')         ||
    request.headers.get('PAYMENT-SIGNATURE') || null;

  // Ödeme header yoksa → 402
  if (!paymentHeader) {
    const paymentRequiredB64 = btoa(JSON.stringify({ x402Version: 1, accepts: [paymentRequirements] }));
    return jsonRes(402, {
      x402Version: 1,
      accepts: [paymentRequirements],
      error: 'Payment required',
    }, { 'PAYMENT-REQUIRED': paymentRequiredB64 }, origin);
  }

  // Header decode et
  let paymentPayload;
  try {
    paymentPayload = JSON.parse(atob(paymentHeader));
  } catch (e) {
    console.error('[DECODE ERROR]', e.message);
    return jsonRes(400, { error: 'Invalid payment header — Base64 JSON decode failed', details: e.message }, {}, origin);
  }

  // Network normalize et
  if (paymentPayload.network === NETWORK_CAIP2) paymentPayload.network = NETWORK;

  const cdpPaymentRequirements = { ...paymentRequirements, network: NETWORK };

  console.log('[x402] Payment payload received:', JSON.stringify(paymentPayload).slice(0, 200));

  // ── ADIM 1: Verify ──
  let verifyResult;
  try {
    verifyResult = await cdpRequest(CDP_VERIFY, {
      x402Version:         1,
      paymentPayload,
      paymentRequirements: cdpPaymentRequirements,
    }, cdpKeyName, cdpKeySecret);
    console.log('[CDP VERIFY]', verifyResult.status, JSON.stringify(verifyResult.data));
  } catch (e) {
    console.error('[VERIFY ERROR]', e.message);
    return jsonRes(502, { error: 'CDP verify request failed', details: e.message }, {}, origin);
  }

  if (!verifyResult.ok || verifyResult.data?.isValid === false) {
    return jsonRes(402, {
      error:         'Payment verification failed',
      invalidReason: verifyResult.data?.invalidReason || null,
    }, {}, origin);
  }

  // ── ADIM 2: Settle ──
  let settleResult;
  try {
    settleResult = await cdpRequest(CDP_SETTLE, {
      x402Version:         1,
      paymentPayload,
      paymentRequirements: cdpPaymentRequirements,
    }, cdpKeyName, cdpKeySecret);
    console.log('[CDP SETTLE]', settleResult.status, JSON.stringify(settleResult.data));
  } catch (e) {
    console.error('[SETTLE ERROR]', e.message);
    return jsonRes(502, { error: 'CDP settle request failed', details: e.message }, {}, origin);
  }

  if (!settleResult.ok || settleResult.data?.success === false) {
    return jsonRes(402, {
      error:       'Payment settlement failed',
      errorReason: settleResult.data?.errorReason || null,
    }, {}, origin);
  }

  // ── Başarılı ──
  const txHash =
    settleResult.data?.transaction        ||
    settleResult.data?.txHash             ||
    settleResult.data?.result?.transaction || null;

  const payer =
    settleResult.data?.payer                           ||
    paymentPayload?.payload?.authorization?.from       || null;

  const network = settleResult.data?.network || NETWORK;

  const paymentResponse = btoa(JSON.stringify({
    x402Version: 1, scheme: 'exact', network,
    success: true, transaction: txHash, payer,
  }));

  return jsonRes(200, {
    success:  true,
    txHash,
    payer,
    network,
    basescan: txHash ? `https://basescan.org/tx/${txHash}` : null,
  }, {
    'X-PAYMENT-RESPONSE': paymentResponse,
    'PAYMENT-RESPONSE':   paymentResponse,
  }, origin);
}

// ── Router ────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const origin   = request.headers.get('Origin') || '';
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
    }

    if (pathname === '/state' && request.method === 'GET')  return handleGetState(request, env, origin);
    if (pathname === '/state' && request.method === 'POST') return handlePostState(request, env, origin);
    if (request.method === 'POST')                          return handlePayment(request, env, origin);

    return jsonRes(404, { error: 'Not found' }, {}, origin);
  },
};
