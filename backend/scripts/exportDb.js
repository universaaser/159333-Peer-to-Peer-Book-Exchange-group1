const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const OUTPUT_DIR = path.join(__dirname, '../db-export');

const COLLECTIONS = [
  'users',
  'listings',
  'transactions',
  'messages',
  'reviews',
  'reports',
];

async function exportDb() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  for (const name of COLLECTIONS) {
    const col = mongoose.connection.collection(name);
    const docs = await col.find({}).toArray();
    const file = path.join(OUTPUT_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2));
    console.log(`✓ ${name}: ${docs.length} records → ${name}.json`);
  }

  await mongoose.disconnect();
  console.log(`\nDone! Files saved to: ${OUTPUT_DIR}`);
}

exportDb().catch(err => { console.error(err); process.exit(1); });
