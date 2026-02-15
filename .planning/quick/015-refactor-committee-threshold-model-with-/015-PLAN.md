---
phase: quick
plan: 015
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/db/schema.ts
  - backend/drizzle/0004_add_committee_levels_table.sql
  - backend/src/db/seed.ts
  - backend/src/lib/committee.ts
  - backend/src/routes/admin/committee-thresholds.ts
  - backend/src/routes/admin/committee-levels.ts
  - backend/src/routes/admin/index.ts
  - frontend/src/pages/admin/CommitteeThresholdsPage.tsx
  - frontend/src/pages/admin/CommitteeLevelsPage.tsx
  - frontend/src/pages/admin/AdminLayout.tsx
autonomous: true

must_haves:
  truths:
    - "Committee levels are stored as master data with name, mandatory flag, and display order"
    - "Committee thresholds reference levels via FK instead of storing level as string"
    - "Each level can only appear once in thresholds (unique constraint)"
    - "Admin can manage committee levels separately from thresholds"
  artifacts:
    - path: "backend/src/db/schema.ts"
      provides: "committeeLevels table and updated committeeThresholds with FK"
      contains: "committeeLevels"
    - path: "backend/drizzle/0004_add_committee_levels_table.sql"
      provides: "Migration for new schema"
    - path: "backend/src/routes/admin/committee-levels.ts"
      provides: "CRUD endpoints for committee levels"
      exports: ["committeeLevelsRoutes"]
  key_links:
    - from: "committeeThresholds.levelId"
      to: "committeeLevels.id"
      via: "FK reference"
      pattern: "references.*committeeLevels"
---

<objective>
Refactor committee threshold model to use levels as master data with a mandatory flag.

Purpose: Enable future alerting based on mandatory flag and normalize the level data.
Output: New committeeLevels table, updated committeeThresholds with FK, admin UI for both.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/db/schema.ts
@backend/src/routes/admin/committee-thresholds.ts
@backend/src/lib/committee.ts
@frontend/src/pages/admin/CommitteeThresholdsPage.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add committeeLevels table and update schema</name>
  <files>
    backend/src/db/schema.ts
    backend/drizzle/0004_add_committee_levels_table.sql
    backend/src/db/seed.ts
    backend/src/lib/committee.ts
  </files>
  <action>
1. In schema.ts, add committeeLevels table BEFORE committeeThresholds:
   ```typescript
   export const committeeLevels = pgTable('committee_levels', {
     id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
     name: varchar('name', { length: 50 }).notNull().unique(), // 'mandatory', 'optional', 'not_necessary'
     mandatory: boolean('mandatory').notNull().default(false), // True if committee must be engaged
     displayOrder: integer('display_order').notNull(),
     createdAt: timestamp('created_at').defaultNow().notNull(),
     updatedAt: timestamp('updated_at').defaultNow().notNull(),
   });
   ```

2. Update committeeThresholds to reference committeeLevels:
   ```typescript
   export const committeeThresholds = pgTable('committee_thresholds', {
     id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
     levelId: integer('level_id')
       .notNull()
       .references(() => committeeLevels.id, { onDelete: 'restrict' })
       .unique(), // Each level can only appear once
     maxAmount: numeric('max_amount', { precision: 15, scale: 2 }), // null = unlimited
     createdAt: timestamp('created_at').defaultNow().notNull(),
     updatedAt: timestamp('updated_at').defaultNow().notNull(),
   });
   ```
   Remove the `level` varchar column.

3. Create migration 0004_add_committee_levels_table.sql:
   ```sql
   -- Create committee_levels table
   CREATE TABLE committee_levels (
     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     name VARCHAR(50) NOT NULL UNIQUE,
     mandatory BOOLEAN NOT NULL DEFAULT false,
     display_order INTEGER NOT NULL,
     created_at TIMESTAMP DEFAULT NOW() NOT NULL,
     updated_at TIMESTAMP DEFAULT NOW() NOT NULL
   );

   -- Insert default levels
   INSERT INTO committee_levels (name, mandatory, display_order) VALUES
     ('not_necessary', false, 1),
     ('optional', false, 2),
     ('mandatory', true, 3);

   -- Add level_id column to committee_thresholds
   ALTER TABLE committee_thresholds ADD COLUMN level_id INTEGER;

   -- Migrate existing data: map level string to level_id
   UPDATE committee_thresholds ct
   SET level_id = cl.id
   FROM committee_levels cl
   WHERE ct.level = cl.name;

   -- Make level_id NOT NULL and add FK
   ALTER TABLE committee_thresholds ALTER COLUMN level_id SET NOT NULL;
   ALTER TABLE committee_thresholds ADD CONSTRAINT fk_threshold_level
     FOREIGN KEY (level_id) REFERENCES committee_levels(id) ON DELETE RESTRICT;
   ALTER TABLE committee_thresholds ADD CONSTRAINT unique_level_id UNIQUE (level_id);

   -- Drop old level column
   ALTER TABLE committee_thresholds DROP COLUMN level;
   ```

4. Update seed.ts to seed committeeLevels first:
   ```typescript
   // Committee Levels (master data)
   const [levelsCount] = await db.select({ count: count() }).from(committeeLevels);
   if (levelsCount.count === 0) {
     console.log('Seeding committee levels...');
     await db.insert(committeeLevels).values([
       { name: 'not_necessary', mandatory: false, displayOrder: 1 },
       { name: 'optional', mandatory: false, displayOrder: 2 },
       { name: 'mandatory', mandatory: true, displayOrder: 3 },
     ]);
   }
   ```
   Update committeeThresholds seed to use levelId lookup.

5. Update committee.ts determineCommitteeLevel to join with committeeLevels:
   ```typescript
   const thresholds = await db
     .select({
       id: committeeThresholds.id,
       levelId: committeeThresholds.levelId,
       levelName: committeeLevels.name,
       maxAmount: committeeThresholds.maxAmount,
     })
     .from(committeeThresholds)
     .innerJoin(committeeLevels, eq(committeeThresholds.levelId, committeeLevels.id))
     .orderBy(asc(committeeThresholds.maxAmount));

   // Return levelName (the name column) instead of level
   ```
  </action>
  <verify>
    `npm run generate --prefix backend` succeeds
    `npm run build --prefix backend` succeeds
    Migration file exists at backend/drizzle/0004_add_committee_levels_table.sql
  </verify>
  <done>
    committeeLevels table defined in schema with name, mandatory, displayOrder.
    committeeThresholds references levelId with unique constraint.
    Migration handles existing data migration from level string to levelId FK.
    Seed creates both levels and thresholds.
    determineCommitteeLevel uses join to get level name.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create committee levels admin API and update thresholds API</name>
  <files>
    backend/src/routes/admin/committee-levels.ts
    backend/src/routes/admin/committee-thresholds.ts
    backend/src/routes/admin/index.ts
  </files>
  <action>
1. Create committee-levels.ts with CRUD endpoints:
   - GET / - List all levels (ordered by displayOrder)
   - GET /:id - Get single level with usageCount (thresholds using it)
   - POST / - Create level (name, mandatory, displayOrder)
   - PUT /:id - Update level
   - DELETE /:id - Delete level (blocked if used by threshold)

2. Update committee-thresholds.ts:
   - Remove VALID_LEVELS constant
   - Change POST/PUT to accept levelId instead of level string
   - GET / should join with committeeLevels to return level name
   - Validate levelId exists in committeeLevels
   - Return levelName in response for display

3. Register routes in index.ts:
   ```typescript
   import { committeeLevelsRoutes } from './committee-levels.js';
   // Register: fastify.register(committeeLevelsRoutes, { prefix: '/committee-levels' });
   ```
  </action>
  <verify>
    `npm run build --prefix backend` succeeds
    Manual test: POST /api/admin/committee-levels with {"name":"test","mandatory":false,"displayOrder":4}
  </verify>
  <done>
    Committee levels CRUD API works.
    Committee thresholds API uses levelId FK.
    Both endpoints return proper data for frontend.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update frontend admin pages for levels and thresholds</name>
  <files>
    frontend/src/pages/admin/CommitteeLevelsPage.tsx
    frontend/src/pages/admin/CommitteeThresholdsPage.tsx
    frontend/src/pages/admin/AdminLayout.tsx
  </files>
  <action>
1. Create CommitteeLevelsPage.tsx following existing admin page patterns:
   - DataTable with columns: Name, Mandatory (badge), Display Order, Usage, Actions
   - Dialog for create/edit with fields: name (text), mandatory (checkbox), displayOrder (number)
   - Delete blocked when usageCount > 0
   - Mandatory column shows green "Required" badge if true, gray "Optional" badge if false

2. Update CommitteeThresholdsPage.tsx:
   - Fetch committee levels for dropdown
   - Replace hardcoded LEVELS array with fetched data
   - Form uses select with levelId instead of level string
   - Display level name in table (from joined data)
   - Update interface to use levelId and levelName

3. Update AdminLayout.tsx to add Committee Levels nav item:
   - Add item between existing nav items (near thresholds)
   - Label: "Committee Levels"
   - Path: /admin/committee-levels
  </action>
  <verify>
    `npm run build --prefix frontend` succeeds
    Navigate to /admin/committee-levels - page renders
    Navigate to /admin/committee-thresholds - dropdown shows levels from API
  </verify>
  <done>
    CommitteeLevelsPage allows CRUD of levels with mandatory flag.
    CommitteeThresholdsPage uses level dropdown from API.
    Admin nav includes Committee Levels link.
  </done>
</task>

</tasks>

<verification>
1. Backend builds without errors
2. Frontend builds without errors
3. Migration runs successfully (on fresh or existing database)
4. /api/admin/committee-levels returns levels with mandatory flag
5. /api/admin/committee-thresholds returns thresholds with levelName
6. Admin UI shows both pages working
</verification>

<success_criteria>
- committeeLevels table exists with name, mandatory, displayOrder columns
- committeeThresholds.levelId references committeeLevels.id with unique constraint
- determineCommitteeLevel returns correct level based on budget
- Admin can manage levels separately from thresholds
- Mandatory flag persisted and displayed correctly
</success_criteria>

<output>
After completion, create `.planning/quick/015-refactor-committee-threshold-model-with-/015-SUMMARY.md`
</output>
