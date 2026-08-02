import { db } from './db.js';
const counts = Object.fromEntries(['users','events','posts','rewards','companies','employees'].map((table) => [table, db.prepare(`SELECT COUNT(*) count FROM ${table}`).get().count]));
console.log('Database ready:', counts);
