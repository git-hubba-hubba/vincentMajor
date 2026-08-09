import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
export const databasePath = process.env.DB_PATH || join(here, 'cms.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });
export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));

const eventColumns = new Set(db.prepare('PRAGMA table_info(events)').all().map((column) => column.name));
if (!eventColumns.has('category')) db.exec("ALTER TABLE events ADD COLUMN category TEXT NOT NULL DEFAULT 'Community'");
if (!eventColumns.has('image_url')) db.exec('ALTER TABLE events ADD COLUMN image_url TEXT');
if (!eventColumns.has('points_awarded')) db.exec('ALTER TABLE events ADD COLUMN points_awarded INTEGER NOT NULL DEFAULT 100');
const companyColumns = new Set(db.prepare('PRAGMA table_info(companies)').all().map((column) => column.name));
if (!companyColumns.has('spotlight_position')) db.exec('ALTER TABLE companies ADD COLUMN spotlight_position INTEGER CHECK(spotlight_position BETWEEN 1 AND 5)');
if (!companyColumns.has('verified')) db.exec('ALTER TABLE companies ADD COLUMN verified INTEGER NOT NULL DEFAULT 0');
if (!companyColumns.has('image_url')) db.exec('ALTER TABLE companies ADD COLUMN image_url TEXT');
db.prepare("UPDATE companies SET image_url='/images/impDirectory.png' WHERE image_url IS NULL OR image_url=''").run();
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_company_spotlight ON companies(category,spotlight_position) WHERE spotlight_position IS NOT NULL');
const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map((column) => column.name));
if (!userColumns.has('sponsor_badge')) db.exec('ALTER TABLE users ADD COLUMN sponsor_badge INTEGER NOT NULL DEFAULT 0');
const rewardColumns = new Set(db.prepare('PRAGMA table_info(rewards)').all().map((column) => column.name));
if (!rewardColumns.has('image_url')) db.exec('ALTER TABLE rewards ADD COLUMN image_url TEXT');
if (!rewardColumns.has('sponsor_name')) db.exec("ALTER TABLE rewards ADD COLUMN sponsor_name TEXT NOT NULL DEFAULT 'Impact Arlington'");
if (!rewardColumns.has('sponsor_id')) db.exec('ALTER TABLE rewards ADD COLUMN sponsor_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
if (!rewardColumns.has('status')) db.exec("ALTER TABLE rewards ADD COLUMN status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('pending','approved','denied'))");
if (!rewardColumns.has('admin_feedback')) db.exec("ALTER TABLE rewards ADD COLUMN admin_feedback TEXT DEFAULT ''");
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_redemption_once ON reward_redemptions(reward_id,user_id)');
const invitationColumns = new Set(db.prepare('PRAGMA table_info(event_invitations)').all().map((column) => column.name));
if (!invitationColumns.has('recipient_id')) db.exec('ALTER TABLE event_invitations ADD COLUMN recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
const messageColumns = new Set(db.prepare('PRAGMA table_info(direct_messages)').all().map((column) => column.name));
if (!messageColumns.has('recipient_id')) db.exec('ALTER TABLE direct_messages ADD COLUMN recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE');

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

const isProduction = process.env.NODE_ENV === 'production';
const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@impactarlington.org');
const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'ImpactAdmin123!');
if (isProduction && (!adminEmail || adminPassword.length < 12)) {
  throw new Error('Production requires ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
}
if (!db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail)) {
  db.prepare(`INSERT INTO users (first_name,last_name,email,password_hash,role,status,business_tier)
    VALUES (?,?,?,?, 'admin','active','premium')`).run(process.env.ADMIN_FIRST_NAME || 'Impact', process.env.ADMIN_LAST_NAME || 'Administrator', adminEmail, hashPassword(adminPassword));
}

const admin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true' || (!isProduction && process.env.SEED_DEMO_DATA !== 'false');
const shouldSeedDirectory = process.env.SEED_DIRECTORY_DATA === 'true' || !isProduction;
if (shouldSeedDemo && db.prepare('SELECT COUNT(*) count FROM events').get().count === 0) {
  const addEvent = db.prepare(`INSERT INTO events (creator_id,title,description,category,image_url,location,starts_at,ends_at,capacity,attendance_code,points_awarded,status,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const demoEvents = [
    ['Sunset Sounds at the Levitt','Bring a blanket, meet your neighbors, and enjoy an upbeat evening of live music, food trucks, and community fun.','Entertainment','https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop','Levitt Pavilion Arlington','2026-08-15T18:30:00','2026-08-15T21:30:00',500,'SOUNDS26',125,'approved',1],
    ['Move Arlington Wellness Morning','Start the weekend with an all-levels outdoor workout, guided stretch, healthy bites, and free wellness resources.','Health','https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1200&auto=format&fit=crop','River Legacy Parks','2026-08-22T08:00:00','2026-08-22T11:00:00',150,'MOVE100',100,'approved',1],
    ['Money Moves Community Lab','A friendly, judgment-free workshop covering budgets, credit, saving, and practical steps toward financial confidence.','Finances','https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop','George W. Hawkes Downtown Library','2026-08-29T13:00:00','2026-08-29T15:30:00',80,'MONEY75',150,'approved',0],
    ['Taste of Arlington Block Party','Discover local restaurants, makers, performers, and family activities at one big celebration of Arlington flavor.','Community','https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop','Downtown Arlington','2026-09-05T16:00:00','2026-09-05T21:00:00',800,'TASTE26',100,'approved',1],
    ['Neighbors Who Serve Day','Team up for park cleanup, care-kit assembly, and nonprofit projects. Supplies, lunch, and good energy are provided.','Volunteer','https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&auto=format&fit=crop','Bob Cooke Park','2026-09-12T09:00:00','2026-09-12T13:00:00',200,'SERVE50',175,'approved',0],
    ['Family Game Night Under the Stars','Challenge friends to giant games, trivia, and family competitions with prizes and a movie finale after sunset.','Family','https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop','Tierra Verde Golf Club Lawn','2026-09-19T17:30:00','2026-09-19T21:00:00',250,'PLAY2026',100,'approved',0]
  ];
  for (const event of demoEvents) addEvent.run(admin.id,...event);
}

const demoCompanies = [
  ['Blue Sky Creative Co.','Advertising','Campaign strategy and community-first digital marketing.','https://example.com','(817) 555-0101','Downtown Arlington',1],
  ['Arlington After Five','Arlington Texas Events','Local event planning, experiences, and celebration support.','https://example.com','(817) 555-0102','Arlington, TX',1],
  ['The Junction Social','Bars','Neighborhood gathering place with live music and local flavors.','https://example.com','(817) 555-0103','South Cooper Street',1],
  ['LaunchPad Arlington','Business Opportunity','Mentoring and practical resources for new entrepreneurs.','https://example.com','(817) 555-0104','East Abram Street',1],
  ['Metro Motor Society','Car Clubs','Family-friendly meetups for local auto enthusiasts.','https://example.com','(817) 555-0105','Arlington, TX',1],
  ['Open Arms Community Church','Churches','Faith, service, and neighborhood outreach programs.','https://example.com','(817) 555-0106','West Park Row Drive',1],
  ['NeighborLink Resource Center','Community Resources','Connections to food, housing, and family support.','https://example.com','(817) 555-0107','North Center Street',1],
  ['Solid Ground Builders','Contractors','Residential renovation and dependable home repairs.','https://example.com','(817) 555-0108','Arlington, TX',1],
  ['Made Here Market','Craft Vendors','Handmade goods from independent North Texas makers.','https://example.com','(817) 555-0109','Downtown Arlington',1],
  ['Impact Perks','Deals & Discounts','Community offers from participating local businesses.','https://example.com','(817) 555-0110','Arlington, TX',1],
  ['Ink & Oak Studio','Design & Print','Branding, signs, apparel, and professional printing.','https://example.com','(817) 555-0111','East Division Street',1],
  ['Bright Futures Learning Lab','Education','Tutoring and enrichment for students of every age.','https://example.com','(817) 555-0112','South Fielder Road',1],
  ['Good Times Live','Entertainment','Performers, music, and production for community events.','https://example.com','(817) 555-0113','Arlington, TX',1],
  ['Smiles in Color','Face Painting','Creative face painting for festivals and family celebrations.','https://example.com','(817) 555-0114','Mobile service',1],
  ['Rolling Flavor Kitchen','Food Vendors','Fresh street food for events, offices, and neighborhoods.','https://example.com','(817) 555-0115','Mobile service',1],
  ['Community Shield Agency','Insurance','Clear coverage guidance for families and small businesses.','https://example.com','(817) 555-0116','North Collins Street',1],
  ['Arlington Works','Job Board','Local jobs, career coaching, and employer connections.','https://example.com','(817) 555-0117','Arlington, TX',1],
  ['Green Block Landscaping','Landscaping','Sustainable lawn care and outdoor living spaces.','https://example.com','(817) 555-0118','Arlington, TX',1],
  ['Civic Bridge Legal','Legal','Approachable legal services and community education.','https://example.com','(817) 555-0119','West Randol Mill Road',1],
  ['Legacy Life Partners','Life Insurance','Life insurance planning centered on family goals.','https://example.com','(817) 555-0120','Arlington, TX',1],
  ['Arlington Community Services','Local Government','City information and connections to public services.','https://www.arlingtontx.gov','(817) 459-6777','101 W. Abram Street',1],
  ['Arlington Heritage Room','Museum','Stories, collections, and educational local-history programs.','https://example.com','(817) 555-0122','Downtown Arlington',1],
  ['Together North Texas','Nonprofits','Volunteer-powered programs serving local families.','https://example.com','(817) 555-0123','Arlington, TX',1],
  ['Key Community Realty','Real Estate','Local guidance for buying, selling, and renting.','https://example.com','(817) 555-0124','South Bowen Road',1],
  ['Table & Town Kitchen','Restaurants','Comfort food, warm hospitality, and community tables.','https://example.com','(817) 555-0125','Downtown Arlington',1]
];
const addCompany=db.prepare(`INSERT INTO companies(owner_id,name,category,description,website,phone,address,status,featured,spotlight_position) VALUES(?,?,?,?,?,?,?,'approved',1,?)`);
for (const company of shouldSeedDemo ? demoCompanies : []) {
  if (!db.prepare('SELECT id FROM companies WHERE name=?').get(company[0])) addCompany.run(admin.id,...company);
}

const verifiedOrganizations = [
  ['Arlington Fire Department','Local Government','Fire rescue, prevention, inspections, emergency preparedness, and public-safety education.','https://www.arlingtontx.gov/City-Services/Public-Safety/Fire-Department','817-459-5500','620 W. Division St., Arlington, TX 76011'],
  ['Arlington Police Department','Local Government','Public safety, community policing, police reports, records, and neighborhood programs. For emergencies, call 911.','https://www.arlingtontx.gov/City-Services/Public-Safety/Police-Department','817-459-5700','620 W. Division St., Arlington, TX 76011'],
  ['Arlington Parks, Recreation & Culture','Community Resources','City parks, recreation programs, athletics, aquatics, classes, and public facilities.','https://www.arlingtontx.gov/Government/Departments/Department-Directory/Parks-Recreation','817-459-5474','101 W. Abram St., 2nd Floor, Arlington, TX 76010'],
  ['Cliff Nelson Recreation Center','Community Resources','A city recreation center serving residents with sports, fitness, classes, camps, and community activities.','https://www.arlingtontx.gov/Parks-Places/Facilities/Recreation-Centers','817-561-2819','4600 W. Bardin Rd., Arlington, TX 76017'],
  ['Dottie Lynn Recreation Center','Community Resources','Classes for all ages, sports, fitness, after-school care, day camps, and community-room rentals.','https://www.arlingtontx.gov/Parks-Places/Facilities/Recreation-Centers/Dottie-Lynn-Recreation-Center','817-277-5001','3200 Norwood Ln., Arlington, TX 76013'],
  ['East Library & Recreation Center','Community Resources','A combined library and recreation destination offering learning, fitness, programs, and gathering spaces.','https://www.arlingtontx.gov/Parks-Places/Facilities/Recreation-Centers','817-561-2821','1817 New York Ave., Arlington, TX 76010'],
  ['Elzie Odom Athletic Center','Community Resources','Athletic facilities, recreation programming, sports, fitness, and activities for Arlington residents.','https://www.arlingtontx.gov/Parks-Places/Facilities/Recreation-Centers','817-561-2822','1601 NE Green Oaks Blvd., Arlington, TX 76006'],
  ['Eunice Activity Center','Community Resources','Local activity center offering recreation, wellness, social opportunities, and community programming.','https://www.arlingtontx.gov/Parks-Places/Facilities/Recreation-Centers','817-561-2823','1000 Eunice St., Arlington, TX 76010'],
  ['Meadowbrook Recreation Center','Community Resources','Neighborhood recreation programs and accessible activities for youth, adults, and families.','https://www.arlingtontx.gov/Parks-Places/Facilities/Recreation-Centers','817-561-2824','1400 Dugan St., Arlington, TX 76010'],
  ['The Beacon Recreation Center','Community Resources','A modern recreation center offering fitness, aquatics, youth activities, classes, and community events.','https://www.arlingtontx.gov/Parks-Places/Facilities/Recreation-Centers','817-561-2825','1100 Mansfield Webb Rd., Arlington, TX 76002'],
  ['Trinity Community Foundation YMCA Youth Program Center','Education','Youth sports, childcare, camps, enrichment, leadership programs, and family-centered activities.','https://amaymca.org/locations/','817-274-9622','2200 S. Davis Dr., Arlington, TX 76013'],
  ['North YMCA','Community Resources','Fitness, wellness, swimming, family activities, and youth development programs in North Arlington.','https://amaymca.org/locations/','817-548-9622','1005 Skyline Dr., Arlington, TX 76011'],
  ['South Arlington YMCA','Community Resources','Community wellness, aquatics, childcare, youth sports, and programs for individuals and families.','https://amaymca.org/locations/','817-419-9629','7120 S. Cooper St., Arlington, TX 76001'],
  ['Arlington Public Library','Education','Books, technology, research help, youth learning, classes, creative programs, and welcoming public spaces.','https://www.arlingtontx.gov/City-Services/Library','817-459-6900','100 S. Center St., Arlington, TX 76010'],
  ['Arlington Animal Services','Community Resources','Pet adoption, licensing, lost-and-found assistance, animal control, education, and volunteer opportunities.','https://www.arlingtontx.gov/City-Services/Animals-Pets','817-459-5898','1000 SE Green Oaks Blvd., Arlington, TX 76018'],
  ['Mission Arlington / Mission Metroplex','Nonprofits','Community assistance, health services, volunteer opportunities, youth programs, and family support.','https://missionarlington.org','817-277-6620','210 W. South St., Arlington, TX 76010'],
  ['Arlington Charities','Nonprofits','Food assistance, mobile markets, home delivery, and stabilization services for local families and individuals.','https://www.arlingtoncharities.org','817-275-1511','811 Secretary Dr., Arlington, TX 76015'],
  ['River Legacy Foundation','Nonprofits','Environmental education, nature programs, camps, exhibits, events, and stewardship at River Legacy Nature Center.','https://riverlegacy.org','817-860-6752','703 NW Green Oaks Blvd., Arlington, TX 76006']
];
const addVerified=db.prepare(`INSERT INTO companies(owner_id,name,category,description,website,phone,address,status,verified) VALUES(?,?,?,?,?,?,?,'approved',1)`);
for (const organization of shouldSeedDirectory ? verifiedOrganizations : []) {
  if (!db.prepare('SELECT id FROM companies WHERE name=?').get(organization[0])) addVerified.run(admin.id,...organization);
}

const placeholderRewards = [
  ['Local Coffee Pair','Two handcrafted drinks from a participating Arlington café.',250,8,'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80','Impact Arlington'],
  ['Family Movie Night','Two movie passes for an easy community night out.',600,5,'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80','Impact Arlington'],
  ['Community Market Tote','A durable Impact-inspired tote for markets, events, and everyday errands.',350,12,'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&w=1000&q=80','Impact Arlington'],
  ['$20 Local Dining Credit','Enjoy a meal at a participating neighborhood restaurant.',900,4,'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80','Community Dining Partners'],
  ['Wellness Starter Pack','A water bottle, resistance band, and guest wellness class.',750,6,'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1000&q=80','Move Arlington'],
  ['Impact Arlington T-Shirt','A limited community tee made for members who show up and make an impact.',1000,10,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80','Impact Arlington'],
  ['Family Recreation Pass','One-day admission for a family at a participating recreation experience.',1200,3,'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80','Community Recreation Partners'],
  ['VIP Community Event Bundle','Priority entry, reserved seating, and an Impact welcome gift.',1800,2,'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=80','Impact Arlington']
];
if (db.prepare('SELECT COUNT(*) count FROM rewards').get().count === 0) {
  const addReward = db.prepare(`INSERT INTO rewards(name,description,points_cost,inventory,image_url,sponsor_name,sponsor_id,status) VALUES(?,?,?,?,?,?,?,'approved')`);
  for (const reward of placeholderRewards) addReward.run(...reward,admin.id);
}

const placeholderPosts = [
  ['Neighbors Helping Neighbors','This month, volunteers are assembling welcome kits for families settling into Arlington. Small contributions of time, supplies, and encouragement add up to a stronger community.','Community','https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80',1],
  ['A Healthier Start to Saturday','Try a simple community wellness routine: a morning walk, ten minutes of stretching, plenty of water, and a check-in with someone you care about.','Health','https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=80',0],
  ['Three Ways to Make Your Money Go Further','Plan meals before shopping, review recurring subscriptions, and automatically move a small amount into savings each payday. Consistency matters more than perfection.','Finances','https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1200&q=80',0],
  ['Local Music, Food, and Good Energy','Arlington creators and performers are bringing more live experiences into our neighborhoods. Support a local artist and invite someone new to join you.','Entertainment','https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',1],
  ['Spotlight: Community-Owned Businesses','Every purchase from an independent business helps sustain local jobs, ideas, and families. Explore the directory and discover your next neighborhood favorite.','Business','https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',0],
  ['Creating More Places for Young People to Lead','Youth voices belong in conversations about the future. Mentoring, volunteering, sports, and creative programs give young people room to build confidence.','Youth','https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80',0],
  ['This Week Around Arlington','Community events, public resources, workshops, and family activities are happening across the city. Save what interests you and add it to your calendar.','Local News','https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',0]
];
if (db.prepare('SELECT COUNT(*) count FROM posts').get().count === 0) {
  const addPost=db.prepare(`INSERT INTO posts(author_id,title,body,category,image_url,status,featured) VALUES(?,?,?,?,?,'approved',?)`);
  for(const post of placeholderPosts)addPost.run(admin.id,...post);
}
