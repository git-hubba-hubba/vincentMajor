// Run once: preserve attendance history before reducing future configured awards.
export function applyReducedPointAwards(db) {
  db.exec('CREATE TABLE IF NOT EXISTS app_migrations (id TEXT PRIMARY KEY)');
  db.exec('BEGIN IMMEDIATE');
  try {
    if(!db.prepare('SELECT 1 FROM app_migrations WHERE id=?').get('halve-point-awards-v1')) {
      db.exec(`UPDATE event_registrations SET points_earned=(SELECT points_awarded FROM events WHERE events.id=event_id) WHERE attended=1 AND points_earned IS NULL;
        UPDATE events SET points_awarded=MAX(0,CAST(points_awarded/2 AS INTEGER));
        UPDATE reward_video SET points=MAX(1,CAST(points/2 AS INTEGER));`);
      db.prepare('INSERT INTO app_migrations(id) VALUES(?)').run('halve-point-awards-v1');
    }
    db.exec('COMMIT');
  } catch(error){db.exec('ROLLBACK');throw error;}
}
