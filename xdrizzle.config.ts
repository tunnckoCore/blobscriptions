import type { Config } from 'npm:drizzle-kit';

import { getXataClient } from './src/xata.ts';

// import { xata } from './src/xata-client.ts';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  // driver: 'turso',
  dbCredentials: {
    connectionString: `postgresql://s3arm9:xau_x5Wc7MDSs1HfW4hSxyTWUhgxU2lZTyzB@eu-central-1.sql.xata.sh/blobbed_blob20:main?sslmode=require`,
    // url: Deno.env.toObject()['TURSO_DATABASE_URL'],
    // authToken: Deno.env.toObject()['TURSO_AUTH_TOKEN'],
  },
} satisfies Config;
