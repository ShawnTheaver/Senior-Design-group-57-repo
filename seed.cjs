// seed.cjs — FINAL SAFE VERSION (NO BACKTICKS)
require('dotenv').config();
const { Client } = require('pg');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env');
  process.exit(1);
}

console.log('🔌 Connecting to database...');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function makeMNumber(n) {
  return 'M' + String(10000000 + n);
}

async function main() {
  await client.connect();
  console.log('✅ Connected.');
  console.log('🛠️ Ensuring table exists...');

  await client.query(
    'CREATE TABLE IF NOT EXISTS users (' +
      'id BIGSERIAL PRIMARY KEY,' +
      'username TEXT NOT NULL UNIQUE,' +
      'email TEXT NOT NULL UNIQUE,' +
      'password TEXT NOT NULL,' +
      'm_number TEXT NOT NULL UNIQUE,' +
      'created_at TIMESTAMPTZ NOT NULL DEFAULT now()' +
    ');'
  );
  console.log('✅ Table ready.');

  const COUNT = 50;
  console.log('Generating ' + COUNT + ' fake users...');
  const rows = [];
  for (let i = 1; i <= COUNT; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const username = (first + '.' + last + '.' + i).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const email = (first + '.' + last + '.' + i + '@example.com').toLowerCase().replace(/[^a-z0-9.@]/g, '');
    const passwordPlain = 'Test1234!';
    const passwordHash = bcrypt.hashSync(passwordPlain, 10);
    const mNumber = makeMNumber(i);
    rows.push({ username, email, passwordHash, mNumber });
  }
  console.log('✅ Data prepared.');

  console.log('📦 Inserting rows...');
  const cols = ['username', 'email', 'password', 'm_number'];
  const valuesClauseParts = [];
  for (let j = 0; j < rows.length; j++) {
    const base = j * cols.length;
    valuesClauseParts.push(
      '(' +
        '$' + (base + 1) + ',' +
        '$' + (base + 2) + ',' +
        '$' + (base + 3) + ',' +
        '$' + (base + 4) +
      ')'
    );
  }
  const valuesClause = valuesClauseParts.join(',');

  const values = [];
  for (let k = 0; k < rows.length; k++) {
    values.push(rows[k].username, rows[k].email, rows[k].passwordHash, rows[k].mNumber);
  }

  await client.query('BEGIN');
  try {
    const sql =
      'INSERT INTO users (' + cols.join(',') + ') VALUES ' + valuesClause + ' ON CONFLICT (email) DO NOTHING';
    await client.query(sql, values);
    await client.query('COMMIT');
    console.log('✅ Insert finished.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Insert failed:', err);
  } finally {
    await client.end();
    console.log('🔌 Disconnected.');
  }

  console.log('🎉 Done!');
}

main().catch((e) => {
  console.error('❌ Script error:', e);
  process.exit(1);
});
