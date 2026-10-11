// Promote a user to admin (role = 'admin'), or list users and their roles.
//
// Usage (run from the backend/ folder):
//   node scripts/adminRole.js                 -> list all users (id, role, email, name)
//   node scripts/adminRole.js --email a@b.com -> set that user's role to 'admin'
//   node scripts/adminRole.js --id 7          -> set user id 7 to 'admin'
//
// Idempotent. It never creates users and never changes anything except `role`.

const db = require('../db');

const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

async function listUsers() {
  const rows = await q('SELECT id, name, email, role FROM users ORDER BY id ASC');
  if (rows.length === 0) {
    console.log('No users found.');
    return;
  }
  console.log('\nid\trole\t\temail\t\t\tname');
  rows.forEach((u) => {
    console.log(`${u.id}\t${u.role || '(none)'}\t\t${u.email}\t\t${u.name}`);
  });
  console.log('\nTo promote a user:  node scripts/adminRole.js --email <their email>\n');
}

async function promote(where, value) {
  const rows = await q(`SELECT id, email, role FROM users WHERE ${where} = ?`, [value]);
  if (rows.length === 0) {
    console.error(`No user found with ${where} = ${value}.`);
    return false;
  }
  const user = rows[0];
  if (String(user.role || '').toLowerCase() === 'admin') {
    console.log(`User #${user.id} (${user.email}) is already an admin.`);
    return true;
  }
  await q("UPDATE users SET role = 'admin' WHERE id = ?", [user.id]);
  console.log(`User #${user.id} (${user.email}) role set to 'admin' (was '${user.role || '(none)'}').`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--list' || args[0] === '-l') {
    await listUsers();
    return;
  }
  if (args[0] === '--id' && args[1]) {
    await promote('id', Number(args[1]));
    return;
  }
  if (args[0] === '--email' && args[1]) {
    await promote('email', args[1]);
    return;
  }
  console.error('Usage: node scripts/adminRole.js [--list | --email <email> | --id <id>]');
  process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error('adminRole failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
