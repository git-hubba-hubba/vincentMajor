import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyReducedPointAwards } from './points-policy.js';

test('reducing future awards preserves history and runs only once',()=>{
  const db=new DatabaseSync(':memory:');
  try{
    db.exec(`CREATE TABLE events(id INTEGER PRIMARY KEY,points_awarded INTEGER);
      CREATE TABLE event_registrations(event_id INTEGER,attended INTEGER,points_earned INTEGER);
      CREATE TABLE reward_video(points INTEGER);
      CREATE TABLE users(points INTEGER);
      CREATE TABLE incentive_claims(points_awarded INTEGER);
      INSERT INTO events VALUES(1,175),(2,100),(3,0);
      INSERT INTO event_registrations VALUES(1,1,NULL),(2,0,NULL);
      INSERT INTO reward_video VALUES(25);
      INSERT INTO users VALUES(900);
      INSERT INTO incentive_claims VALUES(100);`);
    applyReducedPointAwards(db);
    assert.deepEqual(db.prepare('SELECT points_awarded FROM events ORDER BY id').all().map(row=>row.points_awarded),[87,50,0]);
    assert.equal(db.prepare('SELECT points FROM reward_video').get().points,12);
    assert.equal(db.prepare('SELECT points_earned FROM event_registrations WHERE attended=1').get().points_earned,175);
    assert.equal(db.prepare('SELECT points_earned FROM event_registrations WHERE attended=0').get().points_earned,null);
    assert.equal(db.prepare('SELECT points FROM users').get().points,900);
    assert.equal(db.prepare('SELECT points_awarded FROM incentive_claims').get().points_awarded,100);
    applyReducedPointAwards(db);
    assert.equal(db.prepare('SELECT points_awarded FROM events WHERE id=1').get().points_awarded,87);
    assert.equal(db.prepare('SELECT points FROM reward_video').get().points,12);
    assert.equal(db.prepare('SELECT points_earned FROM event_registrations WHERE attended=1').get().points_earned,175);
  }finally{db.close();}
});
