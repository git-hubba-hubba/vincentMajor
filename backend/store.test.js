import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Stripe from 'stripe';

 test('store prices, permissions, signed payment events, and idempotency',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'impact-store-'));
  const requests=[];
  const sessions=new Map();
  const stripeMock=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    const fields=new URLSearchParams(raw);requests.push({path:req.url,fields,key:req.headers['idempotency-key']});
    const key=req.headers['idempotency-key'];
    if(!sessions.has(key))sessions.set(key,{id:`cs_test_${sessions.size+1}`,url:`https://checkout.stripe.com/c/pay/cs_test_${sessions.size+1}`});
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(sessions.get(key)));
  });
  await new Promise(resolve=>stripeMock.listen(0,'127.0.0.1',resolve));
  const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url),env:{...process.env,NODE_ENV:'test',PORT:'0',DB_PATH:join(directory,'test.sqlite'),SEED_DEMO_DATA:'false',ADMIN_EMAIL:'admin@example.com',ADMIN_PASSWORD:'TestPassword123!',BACKUP_INTERVAL_HOURS:'0',STRIPE_SECRET_KEY:'sk_test_fake',STRIPE_WEBHOOK_SECRET:'whsec_test',TEST_STRIPE_PORT:String(stripeMock.address().port),STORE_URL:'https://impact.example.com/',CLOUDINARY_CLOUD_NAME:'',CLOUDINARY_URL:''},stdio:['ignore','pipe','pipe']});
  let stderr='';child.stderr.on('data',chunk=>{stderr+=chunk;});
  try{
    const port=await Promise.race([new Promise(resolve=>child.stdout.on('data',chunk=>{const match=String(chunk).match(/listening on 0\.0\.0\.0:(\d+)/);if(match)resolve(match[1]);})),once(child,'exit').then(()=>{throw new Error(stderr || 'Server exited');})]);
    const base=`http://127.0.0.1:${port}/api`;
    const request=async(path,method='GET',payload,token,status=200)=>{
      const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:payload===undefined?undefined:JSON.stringify(payload)});
      const result=await response.json();assert.equal(response.status,status,JSON.stringify(result));return result;
    };
    const admin=await request('/auth/login','POST',{email:'admin@example.com',password:'TestPassword123!'});
    const member=await request('/auth/register','POST',{firstName:'Store',lastName:'Member',email:'member@example.com',password:'TestPassword123!'});
    const product={name:'Impact shirt',description:'A community favorite. Pickup locally.',price_cents:2500,active:true,requires_shipping:false};
    await request('/store/products','POST',product,member.token,403);
    await request('/store/products','POST',{...product,price_cents:25},admin.token,400);
    await request('/store/products','POST',{...product,price_cents:2500.5},admin.token,400);
    const item=await request('/store/products','POST',product,admin.token,201);
    assert.equal((await request('/store/products')).products[0].name,product.name);
    const checkout={product_id:item.id,quantity:2,request_id:'test-request-00001',total_cents:1,price_cents:1};
    await request('/store/checkout','POST',checkout,undefined,401);
    await request('/store/checkout','POST',{...checkout,quantity:-1},member.token,400);
    const opened=await request('/store/checkout','POST',checkout,member.token);
    assert.match(opened.url,/checkout.stripe.com/);
    assert.equal(requests.length,1);
    const sent=requests[0].fields;
    assert.equal(requests[0].path,'/v1/checkout/sessions');
    assert.equal(sent.get('line_items[0][price_data][unit_amount]'),'2500');
    assert.equal(sent.get('line_items[0][quantity]'),'2');
    assert.equal(sent.get('metadata[user_id]'),String(member.user.id));
    assert.ok(sent.get('success_url').startsWith('https://impact.example.com/'));
    assert.deepEqual(await request('/store/checkout','POST',checkout,member.token),opened);
    assert.equal(requests.length,1);
    await request('/store/checkout','POST',{...checkout,quantity:3},member.token,409);
    assert.equal((await request('/store/orders','GET',undefined,member.token))[0].status,'pending');
    const session={id:'cs_test_1',mode:'payment',amount_total:5000,currency:'usd',payment_status:'paid',metadata:{order_id:String(opened.order_id),user_id:String(member.user.id)},customer_details:{email:'member@example.com'}};
    const webhook=async(event,status=200,valid=true)=>{
      const raw=JSON.stringify(event);
      const signature=Stripe.webhooks.generateTestHeaderString({payload:raw,secret:valid?'whsec_test':'wrong'});
      const response=await fetch(base+'/stripe/webhook',{method:'POST',headers:{'Content-Type':'application/json','Stripe-Signature':signature},body:raw});
      assert.equal(response.status,status,await response.text());
    };
    const event={id:'evt_paid',type:'checkout.session.completed',data:{object:session}};
    await webhook(event,400,false);
    await webhook({...event,id:'evt_mismatch',data:{object:{...session,amount_total:1}}},400);
    await webhook({...event,id:'evt_unpaid',data:{object:{...session,payment_status:'unpaid'}}});
    assert.equal((await request('/store/orders','GET',undefined,member.token))[0].status,'pending');
    await webhook(event);
    await webhook(event);
    await webhook({...event,id:'evt_paid_again'});
    await webhook({...event,id:'evt_late_expired',type:'checkout.session.expired'});
    const paid=(await request('/store/orders','GET',undefined,member.token))[0];
    assert.equal(paid.status,'paid');assert.equal(paid.total_cents,5000);
    const notifications=await request('/notifications','GET',undefined,member.token);
    assert.equal(notifications.filter(item=>item.type==='store').length,1);
    await request(`/store/orders/${paid.id}/fulfill`,'POST',{},member.token,403);
    await request(`/store/orders/${paid.id}/fulfill`,'POST',{},admin.token);
    assert.ok((await request('/store/orders','GET',undefined,member.token))[0].fulfilled_at);
    await request('/store/orders','GET',undefined,undefined,401);
    const other=await request('/auth/register','POST',{firstName:'Other',lastName:'Buyer',email:'other@example.com',password:'TestPassword123!'});
    assert.deepEqual(await request('/store/orders','GET',undefined,other.token),[]);
    await request(`/store/products/${item.id}`,'PATCH',{price_cents:3000,requires_shipping:true},admin.token);
    const shipping=await request('/store/checkout','POST',{product_id:item.id,quantity:1,request_id:'test-shipping-0001'},member.token);
    assert.equal(requests[1].fields.get('shipping_address_collection[allowed_countries][0]'),'US');
    await request(`/store/orders/${shipping.order_id}/fulfill`,'POST',{},admin.token,409);
    await request(`/store/products/${item.id}`,'DELETE',undefined,member.token,403);
    await request(`/store/products/${item.id}`,'DELETE',undefined,admin.token);
    assert.equal((await request('/store/products')).products.length,0);
    assert.equal((await request('/store/products','GET',undefined,admin.token)).products.length,1);
    await request('/store/checkout','POST',{...checkout,request_id:'test-archived-0001'},member.token,404);
    assert.equal((await request('/store/orders','GET',undefined,member.token)).find(order=>order.id===paid.id).total_cents,5000);
  }finally{
    if(child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}
    await new Promise(resolve=>stripeMock.close(resolve));rmSync(directory,{recursive:true,force:true});
  }
});
