import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { db, databasePath } from './db.js';

export function createBackup() {
  const backupDir = process.env.BACKUP_DIR || join(dirname(databasePath), 'backups');
  mkdirSync(backupDir, { recursive:true });
  const stamp = new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
  const destination = join(backupDir, `cms-${stamp}.sqlite`);
  db.exec(`VACUUM INTO '${destination.replaceAll("'", "''")}'`);
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 7);
  const cutoff = Date.now() - retentionDays * 86400000;
  for (const name of readdirSync(backupDir).filter((file)=>file.endsWith('.sqlite'))) {
    const path = join(backupDir,name);
    if (statSync(path).mtimeMs < cutoff) unlinkSync(path);
  }
  return destination;
}

export function scheduleBackups() {
  const hours = Number(process.env.BACKUP_INTERVAL_HOURS || (process.env.NODE_ENV === 'production' ? 24 : 0));
  if (!Number.isFinite(hours) || hours <= 0) return;
  const run = () => { try { console.log(`Database backup created: ${createBackup()}`); } catch(error) { console.error('Database backup failed:',error); } };
  setTimeout(run, 60000).unref();
  setInterval(run, hours * 3600000).unref();
}
