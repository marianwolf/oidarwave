const { getRedisClient } = require('./_client');
const { requireSession } = require('../auth/_session');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
  }

  const session = requireSession(req, res);
  if (!session.ok) return;

  const key = typeof req.query?.key === 'string' ? req.query.key : '';
  if (!key) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Missing key' }));
  }

  try {
    const redis = await getRedisClient();
    const result = await redis.get(key);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, result }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
};
