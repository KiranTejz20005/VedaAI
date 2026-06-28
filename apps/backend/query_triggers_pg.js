const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.tidkdzcbukkvvjkcdwcs:oI9xNMiAGA6NAlIt@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });
  await client.connect();
  const res = await client.query("SELECT prosrc FROM pg_proc WHERE proname = 'notify_on_assignment_published';");
  console.log(res.rows[0].prosrc);
  await client.end();
}
main();
