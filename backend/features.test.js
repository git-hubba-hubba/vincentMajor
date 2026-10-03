import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

test('free rewards and content edits', async () => {
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
    const member = await request('/auth/register','POST',{firstName:'Test',lastName:'Member',email:'member@example.com',password:'TestPassword123!'},undefined,200);
    assert.equal(member.user.points,100);
    assert.equal((await request('/auth/login','POST',{email:'member@example.com',password:'TestPassword123!'})).user.points,100);
    const welcomeReward=await request('/rewards','POST',{name:'Welcome purchase',description:'Spend registration points',points_cost:100,inventory:1},admin.token,201);
    await request(`/rewards/${welcomeReward.id}/redeem`,'POST',{},member.token);
    const reward = await request('/rewards','POST',{name:'Free perk',description:'No points needed',points_cost:0,inventory:2},admin.token,201);
    const claimed = await request(`/rewards/${reward.id}/redeem`,'POST',{},member.token);
    assert.equal(claimed.user.points,0);
    const rewards = await request('/community-rewards','GET',undefined,member.token);
    assert.equal(rewards[0].inventory,1);
    assert.equal(rewards[0].redeemed,1);
    await request(`/rewards/${reward.id}/redeem`,'POST',{},member.token,409);
    const paid = await request('/rewards','POST',{name:'Paid perk',description:'Requires points',points_cost:1000,inventory:1},admin.token,201);
    await request(`/rewards/${paid.id}/redeem`,'POST',{},member.token,409);
    await request('/rewards/donate','POST',{name:'Free donation',description:'A gift',points_cost:0,inventory:1},member.token,201);
    for (const points_cost of [-1,1.5,'',null]) {
      await request('/rewards/donate','POST',{name:'Invalid',description:'Invalid',points_cost,inventory:1},member.token,400);
      await request('/rewards','POST',{name:'Invalid',points_cost},admin.token,400);
      await request(`/rewards/${reward.id}`,'PATCH',{points_cost},admin.token,400);
    }
    const post = await request('/posts','POST',{title:'Original',body:'Original',category:'Community'},admin.token,201);
    const body = 'Visit https://example.com/register?source=impact and www.example.org.\nSee you there!';
    await request(`/posts/${post.id}`,'PATCH',{title:'Updated post',body},admin.token);
    assert.equal((await request(`/posts/${post.id}`)).body,body);
    const event = await request('/community-events','POST',{title:'Original event',description:'Original',location:'Arlington',starts_at:'2030-01-01T18:00:00Z',attendance_code:'TEST'},admin.token,201);
    await request(`/events/${event.id}`,'PATCH',{title:'Updated event',description:body,location:'New location',starts_at:'2030-01-02T18:00:00Z',image_url:'data:image/png;base64,test'},admin.token);
    const updated = await request(`/events/${event.id}`,'GET',undefined,admin.token);
    assert.equal(updated.description,body);
    assert.equal(updated.location,'New location');
    assert.equal(updated.image_url,'data:image/png;base64,test');
    await request(`/events/${event.id}`,'PATCH',{description:'Unauthorized'},member.token,403);
    await request(`/events/${event.id}`,'PATCH',{title:''},admin.token,400);
    // Inbox replies must reach the original sender and stay private to the recipient.
    await request(`/members/user-${member.user.id}/message`,'POST',{body:'Can you help?',member_name:'Test Member'},admin.token,201);
    const inbox = await request('/profile/social','GET',undefined,member.token);
    const original = inbox.messages[0];
    await request(`/messages/${original.id}/reply`,'POST',{body:'Happy to help!'},undefined,401);
    await request(`/messages/${original.id}/reply`,'POST',{body:'Not my inbox'},admin.token,404);
    for (const body of ['', '   ', 'x'.repeat(1001), null, 123]) {
      await request(`/messages/${original.id}/reply`,'POST',{body},member.token,400);
    }
    await request(`/messages/${original.id}/reply`,'POST',{body:' Happy to help! ',recipient_id:member.user.id},member.token,201);
    const senderInbox = await request('/profile/social','GET',undefined,admin.token);
    assert.equal(senderInbox.messages[0].body,'Happy to help!');
    assert.equal(senderInbox.messages[0].first_name,'Test');
    // The sender can continue the conversation by replying to the delivered response.
    await request(`/messages/${senderInbox.messages[0].id}/reply`,'POST',{body:'Thank you!'},admin.token,201);
    const continued = await request('/profile/social','GET',undefined,member.token);
    assert.equal(continued.messages[0].body,'Thank you!');
    const profile = {first_name:'Test',last_name:'Member',email:'member@example.com',bio:'',avatar_url:''};
    const saved = await request('/profile','PATCH',{...profile,occupation:'  Teacher  '},member.token);
    assert.equal(saved.user.occupation,'Teacher');
    assert.equal((await request('/auth/me','GET',undefined,member.token)).user.occupation,'Teacher');
    const members = await request('/community-members');
    assert.equal(members.find(item=>item.id===member.user.id).occupation,'Teacher');
    // Older profile clients must preserve occupation when omitting the field.
    assert.equal((await request('/profile','PATCH',profile,member.token)).user.occupation,'Teacher');
    await request('/profile','PATCH',{...profile,occupation:'x'.repeat(101)},member.token,400);
    await request('/profile','PATCH',{...profile,occupation:123},member.token,400);
    assert.equal((await request('/profile','PATCH',{...profile,occupation:''},member.token)).user.occupation,'');
    // Point amounts are server-controlled and every new-user bonus is awarded once.
    const website=await request('/incentives/website','POST',{},member.token);
    assert.equal(website.awarded,true);assert.equal(website.user.points,25);
    assert.equal((await request('/incentives/website','POST',{},member.token)).awarded,false);
    for(const [incentive_id,points] of [['business-visit',50],['purchase',100],['video',25],['vincent',500]]) {
      await request('/incentive-codes','POST',{incentive_id,label:'Test'},member.token,403);
      const code=await request('/incentive-codes','POST',{incentive_id,label:'Test'},admin.token,201);
      await request('/incentives/claim','POST',{code:code.code},undefined,401);
      const before=(await request('/auth/me','GET',undefined,member.token)).user.points;
      const claimed=await request('/incentives/claim','POST',{code:code.code.toLowerCase(),points:99999},member.token);
      assert.equal(claimed.user.points,before+points);
      await request('/incentives/claim','POST',{code:code.code},member.token,409);
      const other=await request('/incentive-codes','POST',{incentive_id,label:'Other'},admin.token,201);
      await request('/incentives/claim','POST',{code:other.code},member.token,409);
    }
    const disabled=await request('/incentive-codes','POST',{incentive_id:'video',label:'Inactive'},admin.token,201);
    await request('/incentive-codes','PATCH',{id:disabled.id,active:false},admin.token);
    await request('/incentives/claim','POST',{code:disabled.code},member.token,404);
    await request('/incentive-codes','POST',{incentive_id:'registration',label:'Invalid'},admin.token,400);
    const beforeAttendance=(await request('/auth/me','GET',undefined,member.token)).user.points;
    await request(`/events/${event.id}/attendance`,'POST',{code:'TEST'},member.token);
    assert.equal((await request('/auth/me','GET',undefined,member.token)).user.points,beforeAttendance+100);
    await request(`/events/${event.id}/attendance`,'POST',{code:'TEST'},member.token,409);
    const incentiveStatus=await request('/incentives','GET',undefined,member.token);
    assert.equal(incentiveStatus.length,7);assert.ok(incentiveStatus.every(item=>item.claimed));
    const textDefaults=JSON.parse(readFileSync(new URL('./siteText.json',import.meta.url),'utf8'));
    assert.deepEqual(JSON.parse(readFileSync(new URL('../frontend/cms-arlington/cms-admin-arl/src/data/siteText.json',import.meta.url),'utf8')),textDefaults);
    const textKey=textDefaults.find(entry=>entry.section==='Homepage').key;
    assert.deepEqual(await request('/site-text'),{});
    await request('/site-text','PATCH',{changes:{[textKey]:'Not authorized'}},undefined,403);
    await request('/site-text','PATCH',{changes:{[textKey]:'Not authorized'}},member.token,403);
    await request('/users','POST',{first_name:'Test',last_name:'Board',email:'board@example.com',password:'TestPassword123!',role:'board',status:'active'},admin.token,201);
    const board=await request('/auth/login','POST',{email:'board@example.com',password:'TestPassword123!'});
    await request('/site-text','PATCH',{changes:{[textKey]:'Not authorized'}},board.token,403);
    await request('/site-text','PATCH',{changes:{[textKey]:'Updated homepage'}},admin.token);
    assert.equal((await request('/site-text'))[textKey],'Updated homepage');
    for(const value of ['',123,'x'.repeat(5001)]) await request('/site-text','PATCH',{changes:{[textKey]:value}},admin.token,400);
    // A bad key must reject the whole request, including otherwise valid changes.
    await request('/site-text','PATCH',{changes:{[textKey]:'Partial update',unknown:'Invalid'}},admin.token,400);
    assert.equal((await request('/site-text'))[textKey],'Updated homepage');
    await request('/site-text','PATCH',{changes:{[textKey]:null}},admin.token);
    assert.equal(Object.hasOwn(await request('/site-text'),textKey),false);
  } finally {
    const exited = once(child,'exit');
    if (child.exitCode === null) { child.kill(); await exited; }
    rmSync(directory,{recursive:true,force:true});
  }
});
