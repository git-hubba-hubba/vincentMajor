import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export default function Store({user,onProfileClick}) {
  const [products,setProducts]=useState([]);
  const [ready,setReady]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(null);
  const [quantities,setQuantities]=useState({});
  const [orders,setOrders]=useState([]);
  const requests=useRef({});
  const returned=new URLSearchParams(window.location.search).get('checkout');
  const loadOrders=useCallback(()=>user?api('/store/orders?scope=mine').then(setOrders):Promise.resolve(),[user]);
  useEffect(()=>{let active=true;api('/store/products').then(result=>{if(active){setProducts(result.products.filter(item=>item.active));setReady(result.checkoutReady);}}).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  useEffect(()=>{const request=setTimeout(()=>loadOrders().catch(err=>setError(err.message)),0);return()=>clearTimeout(request);},[loadOrders]);
  useEffect(()=>{if(returned!=='success'||!user)return;let tries=0;const timer=setInterval(()=>{loadOrders().catch(()=>{});if(++tries>=10)clearInterval(timer);},3000);return()=>clearInterval(timer);},[returned,user,loadOrders]);
  const buy=async product=>{
    if(!user){onProfileClick();return;}
    if(busy!==null)return;
    const quantity=quantities[product.id] || 1;
    const key=`${product.id}-${quantity}`;
    requests.current[key] ||= crypto.randomUUID();
    setBusy(product.id);setError('');
    try{const result=await api('/store/checkout',{method:'POST',body:JSON.stringify({product_id:product.id,quantity,request_id:requests.current[key]})});const destination=new URL(result.url);if(destination.protocol!=='https:' || destination.hostname!=='checkout.stripe.com')throw new Error('Unable to open secure checkout. Please try again.');window.location.assign(destination.href);}
    catch(err){setError(err.message);setBusy(null);}
  };
  return <main className="storePage"><header className="storeHero"><div><p className="eyebrow">THE IMPACT COLLECTION</p><h1>A little local.<br/><em>A lot of impact.</em></h1><p>Discover something you love from your community.</p></div><span aria-hidden="true">✳</span></header>
    {returned==='success'&&<p className="storeNotice" role="status">Thanks for checking out. Your order’s payment status appears below once confirmed.</p>}{returned==='cancelled'&&<p className="storeNotice" role="status">Checkout was cancelled. You can keep browsing and try again anytime.</p>}
    {error&&<p className="formMessage" role="alert">{error}</p>}
    <div className="storeSectionHeading"><div><p className="eyebrow">CURATED FOR OUR COMMUNITY</p><h2>Shop the collection</h2></div><span>{products.length} {products.length===1?'item':'items'}</span></div>
    {loading?<p role="status">Opening the store…</p>:products.length?<div className="storeProductGrid">{products.map(product=><article className="storeProduct" key={product.id}><div className="storeProductImage"><img src={product.image_url || '/images/banner.png'} alt={product.name}/><span>{product.requires_shipping?'Ships within the US':'Local pickup'}</span></div><div className="storeProductBody"><h3>{product.name}</h3><strong className="storePrice">{money(product.price_cents)}</strong><p>{product.description}</p><div className="storePurchase"><label>Qty<select aria-label={`Quantity for ${product.name}`} value={quantities[product.id]||1} disabled={busy!==null} onChange={event=>setQuantities(current=>({...current,[product.id]:Number(event.target.value)}))}>{Array.from({length:10},(_,index)=><option key={index+1}>{index+1}</option>)}</select></label><button className="primaryButton" disabled={!ready||busy!==null} onClick={()=>buy(product)}>{busy===product.id?'Opening checkout…':!ready?'Checkout coming soon':user?'Buy now ↗':'Sign in to buy ↗'}</button></div></div></article>)}</div>:<div className="storeEmpty"><span aria-hidden="true">✳</span><h3>Good things are on the way.</h3><p>Our first collection will appear here soon.</p></div>}
    {orders.length>0&&user&&<section className="storeOrderHistory"><p className="eyebrow">YOUR COLLECTION</p><h2>Your recent orders</h2>{orders.slice(0,8).map(order=><div key={order.id}><div><strong>#{order.id} · {order.product_name}</strong><small>Quantity {order.quantity} · {money(order.total_cents)}</small></div><span className={`storeOrderStatus ${order.status}`}>{order.fulfilled_at?'Fulfilled':order.status==='paid'?'Paid · preparing your order':order.status==='pending'?'Awaiting payment confirmation':order.status}</span></div>)}</section>}
    <p className="storeFooterNote">Payments are processed securely through Stripe. Pickup items are collected locally; shipping items request a US delivery address at checkout.</p>
  </main>;
}
