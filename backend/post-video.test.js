import test from 'node:test';
import assert from 'node:assert/strict';
import { postVideoSource, videoFromPost, postCategories } from './post-video.js';

test('video links use known players and preserve private Vimeo access', () => {
  for (const url of ['https://youtu.be/abcdefghijk', 'https://www.youtube.com/watch?v=abcdefghijk', 'https://youtube.com/shorts/abcdefghijk']) {
    assert.deepEqual(postVideoSource(url), { type:'embed', src:'https://www.youtube-nocookie.com/embed/abcdefghijk' });
  }
  assert.equal(postVideoSource('https://vimeo.com/123456/secret').src, 'https://player.vimeo.com/video/123456?h=secret');
  assert.equal(postVideoSource('https://player.vimeo.com/video/123456?h=secret').src, 'https://player.vimeo.com/video/123456?h=secret');
  assert.equal(postVideoSource('https://example.com/update.mp4?token=abc').type, 'video');
  assert.equal(postVideoSource('https://res.cloudinary.com/demo/video/upload/v1/update').type, 'video');
  for (const url of ['javascript:alert(1)', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://example.com', 'https://youtube.com/watch?v=bad', 'https://user:pass@example.com/update.mp4', null]) assert.equal(postVideoSource(url), null);
});

test('legacy post videos are detected without treating ordinary links as videos', () => {
  assert.equal(videoFromPost({body:'Read https://example.com. Watch https://youtu.be/abcdefghijk.'}), 'https://youtu.be/abcdefghijk');
  assert.equal(videoFromPost({body:'Visit https://example.com'}), '');
  assert.equal(videoFromPost({video_url:'https://example.com/new.mp4',body:'https://youtu.be/abcdefghijk'}), 'https://example.com/new.mp4');
  assert.equal(postCategories[0], 'The Latest');
  assert.ok(!postCategories.includes('Youth'));
});

// Each deployment has a separate service root, so both copies must accept the same links.
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('independent service roots use the same video parsing contract', () => {
  assert.equal(readFileSync(new URL('./post-video.js',import.meta.url),'utf8'), readFileSync(new URL('../frontend/cms-arlington/cms-admin-arl/src/lib/postVideo.js',import.meta.url),'utf8'));
});

test('upgrade moves existing admin video posts once and preserves conversations', () => {
  const directory=mkdtempSync(join(tmpdir(),'impact-latest-migration-'));
  const path=join(directory,'test.sqlite');
  try {
    const old=new DatabaseSync(path);
    old.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8').replace("  video_url TEXT NOT NULL DEFAULT '',\n",''));
    old.exec(`INSERT INTO users(id,first_name,last_name,email,password_hash,role) VALUES
      (1,'Admin','Test','migration@example.com','unused','admin'),(2,'Member','Test','member@example.com','unused','member');
      INSERT INTO posts(id,author_id,title,body,category,status) VALUES
      (1,1,'Video','Watch https://youtu.be/abcdefghijk.','Community','approved'),
      (2,1,'Article','Visit https://example.com','Community','approved'),
      (3,2,'Member video','https://youtu.be/abcdefghijk','Community','approved'),
      (4,1,'Health video','https://youtu.be/abcdefghijk','Health','approved');
      INSERT INTO post_comments(post_id,user_id,body) VALUES(1,2,'Keep this comment');
      INSERT INTO post_likes(post_id,user_id) VALUES(1,2);`);
    old.close();
    const upgrade=()=>{
      const result=spawnSync(process.execPath,['--input-type=module','-e',"import { db } from './db.js'; db.close();"],{
        cwd:new URL('.',import.meta.url),env:{...process.env,DB_PATH:path,NODE_ENV:'test',ADMIN_EMAIL:'migration@example.com',SEED_DEMO_DATA:'false',SEED_DIRECTORY_DATA:'false'},encoding:'utf8',
      });
      assert.equal(result.status,0,result.stderr);
    };
    upgrade();
    let db=new DatabaseSync(path);
    const post=db.prepare('SELECT * FROM posts WHERE id=1').get();
    assert.equal(post.category,'The Latest');
    assert.equal(post.video_url,'https://youtu.be/abcdefghijk');
    assert.equal(db.prepare('SELECT body FROM post_comments WHERE post_id=1').get().body,'Keep this comment');
    assert.equal(db.prepare('SELECT COUNT(*) count FROM post_likes WHERE post_id=1').get().count,1);
    assert.equal(db.prepare('SELECT category FROM posts WHERE id=2').get().category,'Community');
    assert.equal(db.prepare('SELECT category FROM posts WHERE id=3').get().category,'Community');
    assert.equal(db.prepare('SELECT category FROM posts WHERE id=4').get().category,'Health');
    db.exec("UPDATE posts SET category='Community' WHERE id=1");db.close();
    upgrade();
    db=new DatabaseSync(path);
    assert.equal(db.prepare('SELECT category FROM posts WHERE id=1').get().category,'Community');
    db.close();
  } finally { rmSync(directory,{recursive:true,force:true}); }
});
