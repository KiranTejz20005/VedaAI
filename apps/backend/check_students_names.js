require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client(process.env.DIRECT_URL);
  await client.connect();
  const res = await client.query(`SELECT email, "firstName", "lastName" FROM "User" WHERE role = 'STUDENT'`);
  console.table(res.rows);
  await client.end();
}

main().catch(console.error);
