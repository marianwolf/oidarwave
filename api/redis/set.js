const { getRedisClient } = require('./_client');
const { requireSession } = require('../auth/_session');

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

  const session = requireSession(req, res);
  if (!session.ok) return;

  try {
    const body = await readJsonBody(req);
    const key = typeof body?.key === 'string' ? body.key : '';
    if (!key) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: 'Missing key' }));
    }

    const value =
      typeof body?.value === 'string' ? body.value : JSON.stringify(body?.value ?? null);

    const ttlSecondsRaw = body?.ttlSeconds;
    const ttlSeconds =
      Number.isFinite(ttlSecondsRaw) ? Math.max(0, Math.floor(ttlSecondsRaw)) : 0;

    const redis = await getRedisClient();
    if (ttlSeconds > 0) {
      await redis.set(key, value, { EX: ttlSeconds });
    } else {
      await redis.set(key, value);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
};
