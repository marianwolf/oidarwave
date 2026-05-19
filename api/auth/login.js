const { createSessionCookie, isHttps, makeSetCookie } = require('./_session');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
  }

  const passwordExpected = process.env.AUTH_PASSWORD;
  if (!passwordExpected) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'AUTH_PASSWORD not configured' }));
  }

  try {
    const body = await readJsonBody(req);
    const password = typeof body?.password === 'string' ? body.password : '';
    const user = typeof body?.user === 'string' ? body.user : 'user';
    const ttlSecondsRaw = body?.ttlSeconds;
    const ttlSeconds =
      Number.isFinite(ttlSecondsRaw) ? Math.max(60, Math.floor(ttlSecondsRaw)) : 60 * 60 * 24 * 7;

    if (!password || password !== passwordExpected) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: 'Invalid credentials' }));
    }

    const token = createSessionCookie({ user, ttlSeconds });
    res.statusCode = 200;
    res.setHeader('Set-Cookie', makeSetCookie(token, { maxAgeSeconds: ttlSeconds, secure: isHttps(req) }));
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
};

