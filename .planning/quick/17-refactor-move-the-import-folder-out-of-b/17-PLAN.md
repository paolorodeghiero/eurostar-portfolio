---
phase: quick
plan: 17
type: execute
wave: 1
depends_on: []
files_modified:
  - import/scripts/extract.ts
  - import/scripts/validate.ts
  - import/scripts/load.ts
  - import/scripts/import.ts
  - import/scripts/lib/referential-checker.ts
  - import/package.json
  - import/tsconfig.json
  - import/.gitignore
  - backend/package.json
  - backend/.gitignore
  - Makefile
autonomous: true
must_haves:
  truths:
    - "Import scripts run from project root level"
    - "npm run import:* commands work from import directory"
    - "make import-* commands work unchanged"
    - "Import scripts can access backend db and schema"
  artifacts:
    - path: "import/package.json"
      provides: "Standalone package with import scripts"
    - path: "import/tsconfig.json"
      provides: "TypeScript config for import module"
    - path: "import/.gitignore"
      provides: "Gitignore for staging and source files"
  key_links:
    - from: "import/scripts/*.ts"
      to: "../backend/src/db"
      via: "relative imports"
      pattern: "from.*backend/src/db"
---

<objective>
Move the `backend/import/` folder to project root level (`import/`) for better separation of concerns.

Purpose: The import module is a standalone data pipeline that happens to use the backend's database schema. Moving it to root level makes the architecture clearer and allows independent development.

Output: Import folder at project root with working scripts and updated dependencies.
</objective>

<context>
@Makefile
@backend/package.json
@backend/.gitignore
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move import folder and create standalone package</name>
  <files>
    import/package.json
    import/tsconfig.json
    import/.gitignore
  </files>
  <action>
1. Move backend/import/ to project root using git mv:
   ```bash
   git mv backend/import import
   ```

2. Create `import/package.json` with standalone configuration:
   - name: "eurostar-portfolio-import"
   - type: "module"
   - Scripts: extract, validate, load, all (same as current backend scripts but local)
   - Dependencies: Copy relevant deps from backend (xlsx, js-yaml, fast-csv, zod, dotenv)
   - Copy drizzle-orm, pg, @types/pg for database access
   - devDependencies: tsx, typescript, @types/node, @types/js-yaml

3. Create `import/tsconfig.json`:
   - target: ES2022
   - module: NodeNext
   - moduleResolution: NodeNext
   - strict: true
   - esModuleInterop: true
   - skipLibCheck: true
   - include: ["scripts/**/*"]

4. Create `import/.gitignore` (move relevant entries from backend/.gitignore):
   ```
   node_modules/
   staging/*.csv
   staging/*.md
   source/*
   !source/.gitkeep
   ```
  </action>
  <verify>
    ls -la import/package.json import/tsconfig.json import/.gitignore
  </verify>
  <done>Import folder at root with package.json, tsconfig.json, and .gitignore</done>
</task>

<task type="auto">
  <name>Task 2: Update import paths in all scripts</name>
  <files>
    import/scripts/extract.ts
    import/scripts/validate.ts
    import/scripts/load.ts
    import/scripts/import.ts
    import/scripts/lib/referential-checker.ts
  </files>
  <action>
Update all relative imports from backend to use new path structure:

1. In load.ts and any script importing from backend:
   - Change: `from '../../src/db/index.js'`
   - To: `from '../../backend/src/db/index.js'`

   - Change: `from '../../src/db/schema.js'`
   - To: `from '../../backend/src/db/schema.js'`

2. In lib/referential-checker.ts:
   - Change: `from '../../../src/db/index.js'`
   - To: `from '../../../backend/src/db/index.js'`

   - Change: `from '../../../src/db/schema.js'`
   - To: `from '../../../backend/src/db/schema.js'`

3. Search all .ts files in import/scripts for any `from '../../src/` or `from '../../../src/` patterns and update to `from '../../backend/src/` or `from '../../../backend/src/` respectively.
  </action>
  <verify>
    grep -r "from.*src/db" import/scripts/ --include="*.ts" | grep -v "backend/src" && echo "FAIL: Old imports found" || echo "PASS: All imports updated"
  </verify>
  <done>All import statements point to ../backend/src/db paths</done>
</task>

<task type="auto">
  <name>Task 3: Update Makefile and cleanup backend references</name>
  <files>
    Makefile
    backend/package.json
    backend/.gitignore
  </files>
  <action>
1. Update Makefile import targets to run from import/ directory:
   ```makefile
   import-extract:
   	cd import && npm run extract

   import-validate:
   	cd import && npm run validate

   import-load:
   	cd import && npm run load

   import-all:
   	cd import && npm run all

   import-dry-run:
   	cd import && npm run dry-run

   import-help:
   	cd import && npm run import -- --help
   ```

2. Remove import-related scripts from backend/package.json:
   - Remove: import, import:extract, import:validate, import:load, import:all, import:dry-run

3. Remove import-related entries from backend/.gitignore:
   - Remove: import/staging/*.csv, import/staging/*.md, import/source/*, !import/source/.gitkeep

4. Run `cd import && npm install` to install dependencies

5. Test that `make import-help` works correctly
  </action>
  <verify>
    make import-help && echo "PASS: Import help works" || echo "FAIL: Import help failed"
  </verify>
  <done>Makefile updated, backend cleaned up, import module standalone and functional</done>
</task>

</tasks>

<verification>
- `ls import/` shows mappings, scripts, source, staging directories
- `cat import/package.json` shows standalone package config
- `grep -r "backend/src/db" import/scripts/` finds updated imports
- `make import-extract` runs successfully (or fails gracefully if no source file)
- `make import-help` shows import tool help
</verification>

<success_criteria>
- Import folder exists at project root level
- Import scripts have own package.json with dependencies
- Import scripts correctly reference backend/src/db for database access
- Makefile targets work unchanged from user perspective
- Backend package.json no longer has import scripts
- Git history preserved via git mv
</success_criteria>

<output>
After completion, create `.planning/quick/17-refactor-move-the-import-folder-out-of-b/17-SUMMARY.md`
</output>
