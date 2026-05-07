const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const INPUT_DIR = path.join(__dirname, '../db-export');

const COLLECTIONS = [
  'users',
  'listings',
  'transactions',
  'messages',
  'reviews',
  'reports',
];

async function importDb() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const name of COLLECTIONS) {
    const file = path.join(INPUT_DIR, `${name}.json`);
    if (!fs.existsSync(file)) {
      console.log(`⚠ Skipped ${name}.json (file not found)`);
      continue;
    }

    const docs = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (docs.length === 0) {
      console.log(`– ${name}: empty, skipped`);
      continue;
    }

    const col = mongoose.connection.collection(name);
    await col.deleteMany({});          // 清空旧数据
    await col.insertMany(docs);        // 插入导出的数据
    console.log(`✓ ${name}: ${docs.length} records imported`);
  }

  await mongoose.disconnect();
  console.log('\nDone! Database restored successfully.');
}

importDb().catch(err => { console.error(err); process.exit(1); });
