const { isHttps, makeSetCookie } = require('./_session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
  }

  res.statusCode = 200;
  res.setHeader('Set-Cookie', makeSetCookie('', { maxAgeSeconds: 0, secure: isHttps(req) }));
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true }));
};

