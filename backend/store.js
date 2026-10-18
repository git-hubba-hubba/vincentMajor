import Stripe from 'stripe';
import { db } from './db.js';
import { persistImage } from './storage.js';

function stripeClient() {
  if(!process.env.STRIPE_SECRET_KEY)return null;
  const testing=process.env.NODE_ENV==='test' && process.env.TEST_STRIPE_PORT;
  return new Stripe(process.env.STRIPE_SECRET_KEY,{maxNetworkRetries:2,timeout:15000,...(testing?{host:'127.0.0.1',port:Number(process.env.TEST_STRIPE_PORT),protocol:'http'}:{})});
}
function storeUrl() {
  const url=new URL(process.env.STORE_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim());
  if(!['http:','https:'].includes(url.protocol) || url.username || url.password || (process.env.NODE_ENV==='production' && url.protocol!=='https:'))throw new Error('Configure STORE_URL with the public HTTPS frontend URL.');
  url.hash='';url.search='';url.searchParams.set('page','Store');return url;
}
const ready=()=>Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

export async function handleStore(req,res,path,user,{send,body}) {
  if(!path.startsWith('/api/store/') && path!=='/api/stripe/webhook')return false;
  const reply=(status,data)=>{send(res,status,data);return true;};
  res.setHeader('Cache-Control','no-store');
  if(path==='/api/stripe/webhook' && req.method==='POST') {
    const stripe=stripeClient();
    if(!stripe || !process.env.STRIPE_WEBHOOK_SECRET)return reply(503,{error:'Payments are not configured.'});
    let raw=Buffer.alloc(0);
    for await(const chunk of req){raw=Buffer.concat([raw,chunk]);if(raw.length>1e6)return reply(413,{error:'Webhook payload too large.'});}
    let event;
    try{event=stripe.webhooks.constructEvent(raw,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);}catch{return reply(400,{error:'Invalid webhook signature.'});}
    const supported=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'];
    if(!supported.includes(event.type))return reply(200,{received:true});
    const session=event.data.object;
    const order=db.prepare('SELECT * FROM store_orders WHERE id=?').get(Number(session.metadata?.order_id)||0);
    if(!order)return reply(200,{received:true});
    if(session.mode!=='payment' || session.metadata?.user_id!==String(order.user_id) || (order.stripe_session_id && order.stripe_session_id!==session.id) || session.currency!==order.currency || session.amount_total!==order.total_cents)return reply(400,{error:'Checkout does not match the order.'});
    db.exec('BEGIN IMMEDIATE');
    try{
      const inserted=db.prepare('INSERT OR IGNORE INTO store_webhook_events(id) VALUES(?)').run(event.id);
      if(inserted.changes){
        const paid=['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type) && session.payment_status==='paid';
        if(paid){
          const result=db.prepare("UPDATE store_orders SET status='paid',stripe_session_id=?,customer_email=?,shipping_details=? WHERE id=? AND status!='paid'").run(session.id,session.customer_details?.email || null,JSON.stringify(session.collected_information?.shipping_details || session.shipping_details || null),order.id);
          if(result.changes)db.prepare('INSERT INTO notifications(user_id,type,message) VALUES(?,?,?)').run(order.user_id,'store',`Payment received for order #${order.id}: ${order.product_name}.`);
        }else if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type))db.prepare("UPDATE store_orders SET status=? WHERE id=? AND status!='paid'").run(event.type==='checkout.session.expired'?'expired':'failed',order.id);
      }
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
    return reply(200,{received:true});
  }
  const productRoute=path.match(/^\/api\/store\/products(?:\/(\d+))?$/);
  if(productRoute) {
    const id=Number(productRoute[1]);
    if(req.method==='GET' && !id)return reply(200,{products:db.prepare(`SELECT * FROM store_products ${user?.role==='admin'?'': 'WHERE active=1'} ORDER BY id DESC`).all(),checkoutReady:ready()});
    if(user?.role!=='admin'||user.status!=='active')return reply(403,{error:'Only administrators can manage store products.'});
    if(req.method==='DELETE' && id){const result=db.prepare('UPDATE store_products SET active=0 WHERE id=?').run(id);return result.changes?reply(200,{message:'Product archived.'}):reply(404,{error:'Product not found.'});}
    if(['POST','PATCH'].includes(req.method)) {
      const previous=id?db.prepare('SELECT * FROM store_products WHERE id=?').get(id):null;
      if(req.method==='PATCH'&&!previous)return reply(404,{error:'Product not found.'});
      const input=await body(req,4e6);const data={...previous,...input};
      const name=typeof data.name==='string'?data.name.trim():'';
      const description=typeof data.description==='string'?data.description.trim():'';
      if(!name || name.length>120 || description.length>1500 || !Number.isInteger(data.price_cents) || data.price_cents<50 || data.price_cents>99999999)return reply(400,{error:'Enter a name, description up to 1,500 characters, and a USD price from $0.50 to $999,999.99.'});
      if(data.coming_soon!==undefined && ![true,false,0,1].includes(data.coming_soon))return reply(400,{error:"Choose a valid Coming Soon setting."});
      if(data.active!==undefined && ![true,false,0,1].includes(data.active) || data.requires_shipping!==undefined && ![true,false,0,1].includes(data.requires_shipping))return reply(400,{error:'Choose valid product availability and delivery options.'});
      let image=data.image_url || '';
      if(typeof image!=='string' || image.length>3e6 || (image && image!==previous?.image_url && !/^\/images\/store\/[a-z0-9-]+\.(png|webp|jpg)$/i.test(image) && !/^https:\/\//.test(image) && !/^data:image\/(png|jpeg|webp|gif);base64,/.test(image)))return reply(400,{error:'Use an HTTPS image URL or upload an image smaller than 2 MB.'});
      image=await persistImage(image,'impact-arlington/store');
      const values=[name,description,image,data.price_cents,data.active===undefined?1:Number(Boolean(data.active)),Number(Boolean(data.requires_shipping)),Number(Boolean(data.coming_soon))];
      if(previous)db.prepare('UPDATE store_products SET name=?,description=?,image_url=?,price_cents=?,active=?,requires_shipping=?,coming_soon=? WHERE id=?').run(...values,id);
      else {const result=db.prepare('INSERT INTO store_products(name,description,image_url,price_cents,active,requires_shipping,coming_soon) VALUES(?,?,?,?,?,?,?)').run(...values);return reply(201,{id:Number(result.lastInsertRowid)});}
      return reply(200,{message:'Product saved.'});
    }
  }
  if(path==='/api/store/checkout' && req.method==='POST') {
    if(!user || user.status!=='active')return reply(401,{error:'Sign in to purchase an item.'});
    if(!ready())return reply(503,{error:'Checkout is not available yet. Please check back soon.'});
    const data=await body(req,10000);
    if(!Number.isInteger(data.product_id)||!Number.isInteger(data.quantity)||data.quantity<1||data.quantity>10||typeof data.request_id!=='string'||!/^[\w-]{16,80}$/.test(data.request_id))return reply(400,{error:'Choose a product and a quantity between 1 and 10.'});
    const availableProduct=db.prepare('SELECT active,coming_soon FROM store_products WHERE id=?').get(data.product_id);
    if(!availableProduct?.active)return reply(404,{error:'This item is no longer available.'});
    if(availableProduct.coming_soon)return reply(409,{error:'This item is coming soon and is not available to purchase yet.'});
    let order=db.prepare('SELECT * FROM store_orders WHERE user_id=? AND request_id=?').get(user.id,data.request_id);
    if(order && (order.product_id!==data.product_id || order.quantity!==data.quantity))return reply(409,{error:'This checkout request belongs to another selection.'});
    if(order && order.status!=='pending')return reply(409,{error:'This checkout is no longer pending. Start a new checkout.'});
    if(order?.checkout_url)return reply(200,{url:order.checkout_url,order_id:order.id});
    const url=storeUrl();
    if(!order){
      const product=db.prepare('SELECT * FROM store_products WHERE id=? AND active=1').get(data.product_id);
      if(!product)return reply(404,{error:'This item is no longer available.'});
      if(product.price_cents*data.quantity>99999999)return reply(400,{error:'This quantity exceeds the maximum checkout total. Choose fewer items.'});
      // Limit pending checkouts without trusting client-supplied prices.
      if(db.prepare("SELECT COUNT(*) count FROM store_orders WHERE user_id=? AND status='pending' AND created_at>datetime('now','-1 hour')").get(user.id).count>=10)return reply(429,{error:'Too many checkouts started. Please try again later.'});
      const result=db.prepare('INSERT INTO store_orders(user_id,product_id,product_name,quantity,unit_price,total_cents,requires_shipping,request_id) VALUES(?,?,?,?,?,?,?,?)').run(user.id,product.id,product.name,data.quantity,product.price_cents,product.price_cents*data.quantity,product.requires_shipping,data.request_id);
      order=db.prepare('SELECT * FROM store_orders WHERE id=?').get(Number(result.lastInsertRowid));
    }
    const success=new URL(url);success.searchParams.set('checkout','success');success.searchParams.set('order',String(order.id));
    const cancel=new URL(url);cancel.searchParams.set('checkout','cancelled');
    try{
      const session=await stripeClient().checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer_email:user.email,client_reference_id:String(order.id),metadata:{order_id:String(order.id),user_id:String(user.id)},line_items:[{price_data:{currency:'usd',unit_amount:order.unit_price,product_data:{name:order.product_name}},quantity:order.quantity}],...(order.requires_shipping?{shipping_address_collection:{allowed_countries:['US']}}:{}),success_url:success.toString(),cancel_url:cancel.toString()},{idempotencyKey:`store-order-${order.id}`});
      db.prepare('UPDATE store_orders SET stripe_session_id=?,checkout_url=? WHERE id=?').run(session.id,session.url,order.id);
      return reply(200,{url:session.url,order_id:order.id});
    }catch(error){console.error('Stripe checkout creation failed:',error.type || 'connection error');return reply(502,{error:'Checkout could not be opened. Please try again.'});}
  }
  if(path==='/api/store/orders' && req.method==='GET') {
    if(!user)return reply(401,{error:'Sign in to view orders.'});
    const admin=user.role==='admin' && new URL(req.url,'http://localhost').searchParams.get('scope')!=='mine';
    return reply(200,db.prepare(`SELECT id,product_name,quantity,total_cents,currency,status,fulfilled_at,created_at${admin?',customer_email,shipping_details':''} FROM store_orders ${admin?'':'WHERE user_id=?'} ORDER BY id DESC LIMIT 100`).all(...(admin?[]:[user.id])));
  }
  const fulfill=path.match(/^\/api\/store\/orders\/(\d+)\/fulfill$/);
  if(fulfill && req.method==='POST') {
    if(user?.role!=='admin'||user.status!=='active')return reply(403,{error:'Administrator access required.'});
    const result=db.prepare("UPDATE store_orders SET fulfilled_at=COALESCE(fulfilled_at,CURRENT_TIMESTAMP) WHERE id=? AND status='paid'").run(Number(fulfill[1]));
    return result.changes?reply(200,{message:'Order marked fulfilled.'}):reply(409,{error:'Only paid orders can be fulfilled.'});
  }
  return reply(404,{error:'Store route not found.'});
}
