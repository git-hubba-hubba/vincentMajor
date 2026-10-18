import { db } from './db.js';
const demos=[
  ['impact-classic','The Original · Impact Tee','The one that started the conversation. A crisp white tee with the classic navy IMPACT wordmark and a sky-blue accent. Made for coffee meetups, volunteer mornings, and showing up for your city. Demo concept — final details and sizing coming soon.',2800],
  ['impact-after-hours','After Hours · Midnight Tee','Same community spirit. A different kind of energy. Deep navy with a soft cream IMPACT wordmark, imagined for outdoor concerts, downtown evenings, and your next local adventure. Demo concept — final details and sizing coming soon.',3200],
  ['impact-neighborhood','Good Neighbors · Sage Tee','Rooted in the neighborhood. A soft sage colorway with a forest-green IMPACT wordmark, inspired by park days, farmers markets, and the people who make Arlington feel like home. Demo concept — final details and sizing coming soon.',3000],
];
let added=0;
const insert=db.prepare('INSERT OR IGNORE INTO store_products(demo_key,name,description,image_url,price_cents,active,requires_shipping,coming_soon) VALUES(?,?,?,?,?,1,0,1)');
db.exec('BEGIN IMMEDIATE');
try{for(const [key,name,description,price] of demos)added+=Number(insert.run(key,name,description,`/images/store/${key}.png`,price).changes);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
console.log(`Added ${added} Coming Soon demo products. Existing products were preserved.`);
db.close();
