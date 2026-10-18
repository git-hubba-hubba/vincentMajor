import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

test('password recovery delivers private expiring links and revokes sessions',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'impact-password-reset-'));
  const emails=[];
  let failDelivery=false;
  const mail=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    if(!failDelivery)emails.push(JSON.parse(raw));
    res.writeHead(failDelivery?503:200,{'Content-Type':'application/json'});res.end(JSON.stringify({id:'test-email'}));
  });
  await new Promise(resolve=>mail.listen(0,'127.0.0.1',resolve));
  const dbPath=join(directory,'test.sqlite');
  const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url),env:{...process.env,NODE_ENV:'test',PORT:'0',DB_PATH:dbPath,SEED_DEMO_DATA:'false',ADMIN_EMAIL:'admin@example.com',ADMIN_PASSWORD:'TestPassword123!',BACKUP_INTERVAL_HOURS:'0',RESEND_API_KEY:'test-key',EMAIL_FROM:'Impact <reset@example.com>',PASSWORD_RESET_URL:'https://impact.example.com/',PASSWORD_RESET_TEST_EMAIL_URL:`http://127.0.0.1:${mail.address().port}/emails`},stdio:['ignore','pipe','pipe']});
  let stderr='';child.stderr.on('data',chunk=>{stderr+=chunk;});
  let database;
  try{
    const port=await Promise.race([new Promise(resolve=>child.stdout.on('data',chunk=>{const match=String(chunk).match(/listening on 0\.0\.0\.0:(\d+)/);if(match)resolve(match[1]);})),once(child,'exit').then(()=>{throw new Error(stderr || 'Server exited');})]);
    const request=async(path,payload,token,status=200)=>{
      const response=await fetch(`http://127.0.0.1:${port}/api${path}`,{method:payload===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:payload===undefined?undefined:JSON.stringify(payload)});
      const result=await response.json();assert.equal(response.status,status,result.error);return result;
    };
    const original='OriginalPassword123!';
    const member=await request('/auth/register',{firstName:'Reset',lastName:'Member',email:'member@example.com',password:original});
    await request('/auth/forgot-password',{email:'bad address'},undefined,400);
    const unknown=await request('/auth/forgot-password',{email:'unknown@example.com'});
    assert.equal(emails.length,0);
    const known=await request('/auth/forgot-password',{email:' MEMBER@EXAMPLE.COM '});
    assert.deepEqual(known,unknown);
    assert.deepEqual(Object.keys(known),['message']);
    assert.equal(emails.length,1);assert.deepEqual(emails[0].to,['member@example.com']);
    const tokenFrom=email=>new URLSearchParams(new URL(email.text.match(/https:\/\/\S+/)[0]).hash.slice(1)).get('reset-password');
    const expired=tokenFrom(emails[0]);
    database=new DatabaseSync(dbPath);
    const hashed=createHash('sha256').update(expired).digest('hex');
    assert.equal(database.prepare('SELECT token_hash FROM password_resets').get().token_hash,hashed);
    database.prepare('UPDATE password_resets SET expires_at=0').run();
    await request('/auth/reset-password',{token:expired,password:'NewPassword123!'},undefined,400);
    await request('/auth/forgot-password',{email:'member@example.com'});
    const valid=tokenFrom(emails[1]);
    await request('/auth/forgot-password',{email:'member@example.com'});
    const another=tokenFrom(emails[2]);
    await request('/auth/reset-password',{token:valid,password:'short'},undefined,400);
    await request('/auth/reset-password',{token:'invalid',password:'NewPassword123!'},undefined,400);
    const changed=await request('/auth/reset-password',{token:valid,password:'NewPassword123!'});
    assert.match(changed.message,/Sign in/);
    await request('/auth/me',undefined,member.token,401);
    await request('/auth/login',{email:'member@example.com',password:original},undefined,401);
    const signedIn=await request('/auth/login',{email:'member@example.com',password:'NewPassword123!'});
    assert.equal(signedIn.user.id,member.user.id);
    await request('/auth/reset-password',{token:valid,password:'AnotherPassword!'},undefined,400);
    await request('/auth/reset-password',{token:another,password:'AnotherPassword!'},undefined,400);
    assert.equal(database.prepare('SELECT COUNT(*) count FROM password_resets').get().count,0);
    failDelivery=true;
    assert.deepEqual(await request('/auth/forgot-password',{email:'member@example.com'}),unknown);
    assert.equal(database.prepare('SELECT COUNT(*) count FROM password_resets').get().count,0);
    for(let index=0;index<5;index++)await request('/auth/forgot-password',{email:'rate@example.com'});
    await request('/auth/forgot-password',{email:'rate@example.com'},undefined,429);
    assert.equal(emails.length,3);
  }finally{
    database?.close();
    if(child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}
    await new Promise(resolve=>mail.close(resolve));
    rmSync(directory,{recursive:true,force:true});
  }
});
