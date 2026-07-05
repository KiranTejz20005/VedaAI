require('dotenv').config();
const { Client } = require('pg');

const client = new Client(process.env.DIRECT_URL);
client.connect()
  .then(() => client.query('SELECT email FROM "User" WHERE role = \'SUPER_ADMIN\''))
  .then(res => {
    console.log("Super Admins:", res.rows);
    return client.query('SELECT * FROM "User" LIMIT 5');
  })
  .then(res => {
    console.log("Any 5 users:", res.rows.map(u => ({ email: u.email, role: u.role })));
  })
  .catch(console.error)
  .finally(() => client.end());
