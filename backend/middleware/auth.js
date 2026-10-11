// Auth reuse: the project has no tokens/sessions. The client identifies the
// user by sending a numeric userId (body `userId`/`user_id`, query, or the
// `x-user-id` header). We validate it against the `users` table and enforce
// the admin role server-side. Error format matches Section 5: { error }.

const db = require('../db');

function extractUserId(req) {
  const raw =
    (req.headers && (req.headers['x-user-id'] || req.headers['user-id'])) ||
    (req.body && (req.body.userId != null ? req.body.userId : req.body.user_id)) ||
    (req.query && (req.query.userId != null ? req.query.userId : req.query.user_id));
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function loadUser(req, res, next) {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  db.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    req.user = rows[0];
    req.userId = rows[0].id;
    next();
  });
}

function requireAdmin(req, res, next) {
  const check = () => {
    const role = String((req.user && req.user.role) || '').trim().toLowerCase();
    if (role !== 'admin') {
      console.warn(
        `[admin-auth] denied: user #${req.userId} role='${(req.user && req.user.role) || '(none)'}'`
      );
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
  if (req.user) return check();
  loadUser(req, res, check);
}

module.exports = { extractUserId, requireUser: loadUser, requireAdmin };
