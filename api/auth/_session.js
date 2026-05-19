const crypto = require('crypto');

const COOKIE_NAME = '__Host-oidarwave_session';

function base64urlEncode(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecodeToString(input) {
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(payloadJson, secret) {
  return base64urlEncode(
    crypto.createHmac('sha256', secret).update(payloadJson).digest()
  );
}

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function isHttps(req) {
  const proto = req.headers['x-forwarded-proto'];
  return proto === 'https' || process.env.NODE_ENV === 'production';
}

function parseCookies(req) {
  const header = req.headers?.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = rest.join('=');
    return acc;
  }, {});
}

function makeSetCookie(value, { maxAgeSeconds = null, secure = true } = {}) {
  const parts = [`${COOKIE_NAME}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  if (typeof maxAgeSeconds === 'number') parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join('; ');
}

function createSessionCookie({ user = 'user', ttlSeconds = 60 * 60 * 24 * 7 } = {}) {
  const secret = process.env.REDIS_SESSION_SECRET;
  if (!secret) throw new Error('Missing REDIS_SESSION_SECRET env var');

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({ user, iat: nowSeconds, exp: nowSeconds + ttlSeconds });
  const sig = sign(payload, secret);
  return `${base64urlEncode(payload)}.${sig}`;
}

function verifySessionCookie(token) {
  const secret = process.env.REDIS_SESSION_SECRET;
  if (!secret) return { ok: false, reason: 'no_secret' };
  if (typeof token !== 'string' || !token.includes('.')) return { ok: false, reason: 'missing' };

  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return { ok: false, reason: 'malformed' };

  let payloadJson;
  try {
    payloadJson = base64urlDecodeToString(payloadB64);
  } catch {
    return { ok: false, reason: 'bad_payload' };
  }

  const expectedSig = sign(payloadJson, secret);
  if (!timingSafeEqual(sig, expectedSig)) return { ok: false, reason: 'bad_sig' };

  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return { ok: false, reason: 'bad_json' };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload?.exp !== 'number' || nowSeconds > payload.exp) return { ok: false, reason: 'expired' };

  return { ok: true, payload };
}

function requireSession(req, res) {
  // If no session secret is configured, do not enforce session auth.
  if (!process.env.REDIS_SESSION_SECRET) return { ok: true, payload: null, enforced: false };

  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const verified = verifySessionCookie(token);
  if (!verified.ok) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
    return { ok: false, enforced: true };
  }
  return { ok: true, payload: verified.payload, enforced: true };
}

module.exports = {
  COOKIE_NAME,
  createSessionCookie,
  isHttps,
  makeSetCookie,
  parseCookies,
  requireSession,
  verifySessionCookie,
};

