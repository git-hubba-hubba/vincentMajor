import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

test('event attendance QR awards points once and preserves history', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'impact-features-'));
  const child = spawn(process.execPath, ['server.js'], {
    cwd: new URL('.', import.meta.url),
    env: { ...process.env, NODE_ENV:'test', PORT:'0', DB_PATH:join(directory,'test.sqlite'), SEED_DEMO_DATA:'false',
      ADMIN_EMAIL:'test@example.com', ADMIN_PASSWORD:'TestPassword123!', BACKUP_INTERVAL_HOURS:'0', CLOUDINARY_CLOUD_NAME:'', CLOUDINARY_URL:'' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  try {
    // The API reports its actual ephemeral port so tests never use a shared database or server.
    const ready = await Promise.race([
      new Promise(resolve => child.stdout.on('data', chunk => {
        const port = String(chunk).match(/listening on 0\.0\.0\.0:(\d+)/)?.[1];
        if (port) resolve(port);
      })),
      once(child, 'exit').then(() => { throw new Error(stderr || 'API exited before startup'); }),
    ]);
    const request = async (path, method='GET', body, token, status=200) => {
      const response = await fetch(`http://127.0.0.1:${ready}/api${path}`, {
        method, headers:{'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{})},
        body:body===undefined?undefined:JSON.stringify(body),
      });
      const result = await response.json();
      assert.equal(response.status, status, JSON.stringify(result));
      return result;
    };
    const admin = await request('/auth/login','POST',{email:'test@example.com',password:'TestPassword123!'});
    const member = await request('/auth/register','POST',{firstName:'Event',lastName:'Member',email:'attendee@example.com',password:'TestPassword123!'});
    const another = await request('/auth/register','POST',{firstName:'Next',lastName:'Member',email:'next@example.com',password:'TestPassword123!'});
    const event = await request('/events','POST',{creator_id:admin.user.id,title:'QR attendance event',description:'Community gathering',location:'Arlington',starts_at:'2030-01-01T18:00:00Z',status:'approved'},admin.token,201);
    const qrPath = `/events/${event.id}/attendance-qr`;
    await request(qrPath,'POST',{points_awarded:125},undefined,403);
    await request(qrPath,'POST',{points_awarded:125},member.token,403);
    for (const points_awarded of [-1, 1.5, '', null, 'abc', Number.MAX_SAFE_INTEGER + 1]) {
      await request(qrPath,'POST',{points_awarded},admin.token,400);
      await request(`/events/${event.id}`,'PATCH',{points_awarded},admin.token,400);
      await request('/events','POST',{title:'Invalid',points_awarded},admin.token,400);
      await request('/community-events','POST',{title:'Invalid',description:'Test',location:'Arlington',starts_at:'2030-01-01',points_awarded},admin.token,400);
    }
    await request(qrPath,'POST',{},admin.token,400);
    const generated = await request(qrPath,'POST',{points_awarded:125},admin.token);
    assert.ok(generated.attendance_code);
    assert.equal(generated.points_awarded,125);
    assert.equal((await request(`/events/${event.id}`,'GET',undefined,admin.token)).points_awarded,125);
    const claimPath = `/events/${event.id}/attendance`;
    await request(claimPath,'POST',{code:generated.attendance_code},undefined,401);
    await request(claimPath,'POST',{code:'wrong'},member.token,400);
    await request(claimPath,'POST',{code:''},member.token,400);
    assert.equal((await request('/auth/me','GET',undefined,member.token)).user.points,50);
    // Simultaneous scans and manual attendance share the same once-per-event award.
    const scans = await Promise.all(Array.from({length:4},async()=>{
      const response = await fetch(`http://127.0.0.1:${ready}/api${claimPath}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${member.token}`},body:JSON.stringify({code:generated.attendance_code})});
      return response.status;
    }));
    assert.equal(scans.filter(status=>status===200).length,1);
    assert.equal(scans.filter(status=>status===409).length,3);
    assert.equal((await request('/auth/me','GET',undefined,member.token)).user.points,175);
    let history = await request('/profile/events','GET',undefined,member.token);
    assert.equal(history.attended.find(item=>item.id===event.id).points_awarded,125);
    const changed = await request(qrPath,'POST',{points_awarded:200},admin.token);
    assert.equal(changed.attendance_code,generated.attendance_code);
    await request(claimPath,'POST',{code:changed.attendance_code},member.token,409);
    history = await request('/profile/events','GET',undefined,member.token);
    assert.equal(history.attended.find(item=>item.id===event.id).points_awarded,125);
    const awarded = await request(claimPath,'POST',{code:generated.attendance_code},another.token);
    assert.equal(awarded.user.points,250);
    assert.equal(awarded.event.points_awarded,200);
    await request(`/events/${event.id}`,'PATCH',{status:'denied'},admin.token);
    await request(qrPath,'POST',{points_awarded:10},admin.token,404);
    await request(claimPath,'POST',{code:generated.attendance_code},another.token,404);
    await request('/events/999999/attendance-qr','POST',{points_awarded:10},admin.token,404);
    // Legacy events without a code gain one; zero points are valid and still record attendance.
    await request(`/events/${event.id}`,'PATCH',{status:'approved',attendance_code:''},admin.token);
    await request(claimPath,'POST',{code:''},admin.token,400);
    const zero = await request(qrPath,'POST',{points_awarded:0},admin.token);
    assert.ok(zero.attendance_code);
    const zeroClaim = await request(claimPath,'POST',{code:zero.attendance_code},admin.token);
    assert.equal(zeroClaim.user.points,admin.user.points);
    assert.equal(zeroClaim.event.points_awarded,0);
  } finally {
    const exited = once(child,'exit');
    if (child.exitCode === null) { child.kill(); await exited; }
    rmSync(directory,{recursive:true,force:true});
  }
});
