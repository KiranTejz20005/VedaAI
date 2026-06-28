const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.tidkdzcbukkvvjkcdwcs:oI9xNMiAGA6NAlIt@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });
  await client.connect();
  const query = "CREATE OR REPLACE FUNCTION public.notify_on_assignment_published()\n" +
  " RETURNS trigger\n" +
  " LANGUAGE plpgsql\n" +
  "AS $function$\n" +
  "BEGIN\n" +
  "  IF (OLD.\"status\" != 'PUBLISHED' OR OLD.\"status\" IS NULL)\n" +
  "     AND NEW.\"status\" = 'PUBLISHED' THEN\n" +
  "    IF NEW.\"createdById\" IS NOT NULL THEN\n" +
  "      INSERT INTO public.\"Notification\" (\n" +
  "        \"id\",\n" +
  "        \"userId\",\n" +
  "        \"organizationId\",\n" +
  "        \"title\",\n" +
  "        \"message\",\n" +
  "        \"type\",\n" +
  "        \"link\",\n" +
  "        \"createdAt\",\n" +
  "        \"isRead\"\n" +
  "      )\n" +
  "      VALUES (\n" +
  "        gen_random_uuid(),\n" +
  "        NEW.\"createdById\",\n" +
  "        NEW.\"organizationId\",\n" +
  "        'Assignment Published',\n" +
  "        format('Your assignment \"%s\" has been published.', NEW.\"title\"),\n" +
  "        'SUCCESS',\n" +
  "        format('/assignments/%s', NEW.\"id\"),\n" +
  "        NOW(),\n" +
  "        false\n" +
  "      );\n" +
  "    END IF;\n" +
  "  END IF;\n" +
  "  RETURN NEW;\n" +
  "END;\n" +
  "$function$;";
  await client.query(query);
  console.log("Function updated");
  await client.end();
}
main();
