import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Open the existing database directly: importing db.js would run startup seeds.
const databasePath = resolve(process.env.DB_PATH || join(dirname(fileURLToPath(import.meta.url)), 'cms.sqlite'));
if (!existsSync(databasePath)) throw new Error(`Database does not exist: ${databasePath}`);
const db = new DatabaseSync(databasePath);
try {
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 10000;');
  const adminsBefore = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id").all();
  if (!adminsBefore.length) throw new Error('Cleanup requires at least one existing administrator.');
  const backupDir = resolve(process.env.BACKUP_DIR || join(dirname(databasePath), 'backups'));
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(backupDir, `before-member-cleanup-${Date.now()}.sqlite`);
  await backup(db, backupPath);
  console.log(`Backup: ${backupPath}`);
  db.exec('BEGIN IMMEDIATE');
  try {
    // These references do not cascade when a member is removed.
    db.exec(`DELETE FROM reward_redemptions WHERE user_id IN (SELECT id FROM users WHERE role <> 'admin');
      DELETE FROM member_connections WHERE member_ref LIKE 'community-%'
      OR member_ref IN (SELECT 'user-' || id FROM users WHERE role <> 'admin');
      DELETE FROM event_invitations WHERE member_ref LIKE 'community-%'
      OR member_ref IN (SELECT 'user-' || id FROM users WHERE role <> 'admin');
      DELETE FROM direct_messages WHERE member_ref LIKE 'community-%'
      OR member_ref IN (SELECT 'user-' || id FROM users WHERE role <> 'admin');`);
    const result = db.prepare("DELETE FROM users WHERE role <> 'admin'").run();
    const adminsAfter = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id").all();
    if (JSON.stringify(adminsBefore) !== JSON.stringify(adminsAfter)) throw new Error('Administrator verification failed.');
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Foreign key verification failed.');
    db.exec('COMMIT');
    console.log(`Deleted ${result.changes} non-admin accounts. Preserved ${adminsAfter.length} administrators.`);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
} finally {
  db.close();
}
