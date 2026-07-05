require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client(process.env.DIRECT_URL);
  await client.connect();
  const res = await client.query('SELECT grade, section, COUNT(*) as c FROM "Class" GROUP BY grade, section HAVING COUNT(*) > 1');
  console.table(res.rows);
  
  const all = await client.query('SELECT grade, section, "organizationId" FROM "Class"');
  console.table(all.rows);
  
  await client.end();
}

main().catch(console.error);
