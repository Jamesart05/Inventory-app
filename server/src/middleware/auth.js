const { verifyToken } = require('../utils/jwt');

const COOKIE_NAME = process.env.COOKIE_NAME || 'inv_token';

function requireAuth(req, res, next) {
  // Accept the token from either the httpOnly cookie or an Authorization
  // header, so the same API can be used from a browser (cookie) or a
  // native/PWA client that prefers bearer tokens.
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const token = req.cookies?.[COOKIE_NAME] || bearer;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { requireAuth, COOKIE_NAME };
