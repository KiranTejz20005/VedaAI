require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client(process.env.DIRECT_URL);
  await client.connect();
  const res = await client.query(`
    SELECT u.email, u."organizationId", o.name 
    FROM "User" u 
    LEFT JOIN "Organization" o ON u."organizationId" = o.id 
    WHERE u.role = 'STUDENT'
  `);
  console.table(res.rows);
  await client.end();
}

main().catch(console.error);
