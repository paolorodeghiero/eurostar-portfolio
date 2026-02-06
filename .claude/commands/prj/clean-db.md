Reset and reseed the database.

This command drops all tables, recreates the schema, and runs the seed script.

<steps>
1. Run database reset from backend directory:
   ```bash
   cd backend && npx drizzle-kit push --force && npm run db:seed
   ```

2. Apply custom SQL migrations (audit trigger):
   ```bash
   cd backend && npx tsx -e "
   import { db } from './src/db/index.js';
   import { sql } from 'drizzle-orm';
   import { readFileSync } from 'fs';

   const trigger = readFileSync('./drizzle/0008_audit_trigger.sql', 'utf8');
   await db.execute(sql.raw(trigger));
   console.log('Audit trigger applied');
   process.exit(0);
   "
   ```

3. Report completion:
   ```
   Database reset and reseeded successfully.
   - Schema pushed
   - Seed data loaded
   - Audit trigger applied
   ```
</steps>
