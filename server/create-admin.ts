import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
try {
  const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
  const password = z.string().min(12).max(72).parse(process.env.ADMIN_PASSWORD);
  if (password === 'replace-with-a-strong-password') throw new Error('Replace the example password before creating an administrator.');
  const name = z.string().min(2).max(100).parse(process.env.ADMIN_NAME || 'Administrator');
  const hash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO admins (name,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash', [name, email, hash]);
  await pool.query('DELETE FROM sessions WHERE admin_id=(SELECT id FROM admins WHERE email=$1)', [email]);
  console.log('Administrator created/updated; existing sessions revoked.');
} finally { await pool.end(); }
