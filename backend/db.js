import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
export const db = new DatabaseSync(join(here, 'cms.sqlite'));
db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

if (!db.prepare('SELECT id FROM users WHERE email = ?').get('admin@impactarlington.org')) {
  db.prepare(`INSERT INTO users (first_name,last_name,email,password_hash,role,status,business_tier)
    VALUES (?,?,?,?, 'admin','active','premium')`).run('Impact', 'Administrator', 'admin@impactarlington.org', hashPassword('ImpactAdmin123!'));
}
