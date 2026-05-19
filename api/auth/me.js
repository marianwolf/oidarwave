const { parseCookies, verifySessionCookie, COOKIE_NAME } = require('./_session');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
  }

  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const verified = verifySessionCookie(token);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  if (!verified.ok) return res.end(JSON.stringify({ ok: false }));

  return res.end(JSON.stringify({ ok: true, user: verified.payload?.user || 'user' }));
};

