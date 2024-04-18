import { drizzle } from 'drizzle-orm/xata-http';
import { Client } from 'pg';

const client = new Client({
  connectionString: `postgresql://s3arm9:xau_x5Wc7MDSs1HfW4hSxyTWUhgxU2lZTyzB@eu-central-1.sql.xata.sh/blobbed_blob20:main?sslmode=require`,
});

export const db = drizzle(client);
