# Import Pipeline

ETL pipeline for importing project portfolio data from Excel into the database.

## Overview

The import pipeline uses a **staged CSV approach** with three sequential stages:

1. **Extract** - Read Excel file, apply value mappings, generate CSV staging files
2. **Validate** - Check CSV schema compliance and cross-CSV referential integrity
3. **Load** - Insert data into database in foreign key order

This architecture ensures all referential data (departments, teams, statuses, outcomes) is explicitly defined in CSVs, validation catches mismatches before touching the database, and load operations are deterministic.

## Directory Structure

```
import/
  source/               # Excel source files (gitignored)
    TPO Portfolio.xlsx  # Default source file

  staging/              # Generated CSV files (gitignored)
    # Referentials
    departments.csv
    teams.csv
    statuses.csv
    outcomes.csv

    # Main data
    projects.csv
    project_teams.csv
    project_values.csv
    project_impact.csv
    budget.csv

    # Reports
    extraction_report.md
    validation_report.md
    load_report.md

  mappings/             # YAML configuration (committed)
    status-mapping.yaml
    team-mapping.yaml
    outcome-mapping.yaml
    tshirt-mapping.yaml

  scripts/              # Import scripts (committed)
    import.ts           # Orchestrator
    extract.ts          # Stage 1
    validate.ts         # Stage 2
    load.ts             # Stage 3
    inspect-excel.ts    # Utility for inspecting Excel structure
    lib/                # Shared utilities
```

## Running the Pipeline

### Full Import (Staged)

```bash
# Extract from Excel to CSV files
npx tsx import/scripts/import.ts -e

# Review staging/extraction_report.md, then validate
npx tsx import/scripts/import.ts -v

# Review staging/validation_report.md, then preview changes
npx tsx import/scripts/import.ts -l --dry-run

# Load to database
npx tsx import/scripts/import.ts -l
```

### Full Import (All Stages)

```bash
# Run all stages sequentially
npx tsx import/scripts/import.ts --all

# Dry run the full pipeline
npx tsx import/scripts/import.ts --all --dry-run
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--extract` | `-e` | Run extract stage |
| `--validate` | `-v` | Run validate stage |
| `--load` | `-l` | Run load stage |
| `--all` | `-a` | Run all stages sequentially |
| `--dry-run` | `-d` | Preview changes without modifying database |
| `--file <path>` | `-f` | Excel file path (default: `TPO Portfolio.xlsx`) |
| `--source <name>` | `-s` | Import source name for tracking |
| `--help` | `-h` | Show help message |

### Individual Scripts

Each stage can be run directly:

```bash
# Extract with custom file
npx tsx import/scripts/extract.ts -f "My Portfolio.xlsx"

# Validate only
npx tsx import/scripts/validate.ts

# Load with dry run
npx tsx import/scripts/load.ts --dry-run

# Inspect Excel file structure
npx tsx import/scripts/inspect-excel.ts "TPO Portfolio.xlsx"
```

## Scripts

### import.ts

Orchestrator that runs stages in sequence. Stops on errors and provides consolidated output.

### extract.ts

Reads the Excel file's "Input" sheet by column position and generates CSV files:

**Referential CSVs:**
- `departments.csv` - Unique departments from impact columns and department owner
- `teams.csv` - Unique teams from team columns with department links
- `statuses.csv` - Unique statuses with colors and display order
- `outcomes.csv` - Value outcome definitions

**Main Data CSVs:**
- `projects.csv` - Project records with mapped fields
- `project_teams.csv` - Team assignments per project with effort sizes
- `project_values.csv` - Value scores (Safety, NPS, EBITDA, Regulatory)
- `project_impact.csv` - Change impact per department
- `budget.csv` - OPEX and CAPEX amounts

Generates `extraction_report.md` with raw-to-mapped value summaries and warnings.

### validate.ts

Validates CSV files using Zod schemas:

**Phase 1:** Schema validation for all CSV files

**Phase 2:** Cross-CSV referential checks:
- `teams.csv` references `departments.csv`
- `projects.csv` references `statuses.csv`, `teams.csv`, `departments.csv`
- `project_teams.csv` references `projects.csv`, `teams.csv`
- `project_values.csv` references `projects.csv`, `outcomes.csv`
- `project_impact.csv` references `projects.csv`, `departments.csv`
- `budget.csv` references `projects.csv`

Generates `validation_report.md` with errors and summary.

### load.ts

Inserts data into the database in foreign key order:

**Phase 1:** Referentials (departments, teams, statuses, outcomes)
- Skips existing records
- Creates new records

**Phase 2:** Main entities (projects, assignments, values, impacts)
- For existing projects, prompts for conflict resolution:
  - **Skip** - Keep existing data
  - **Update** - Merge changed fields only
  - **Overwrite** - Replace all fields
- Supports "All" variants to apply decision to remaining conflicts

Generates `load_report.md` with operation counts.

### inspect-excel.ts

Utility to inspect Excel file structure. Shows header row and first data row by column index.

```bash
npx tsx import/scripts/inspect-excel.ts "TPO Portfolio.xlsx"
```

## Library Modules

### lib/excel-reader.ts

Reads Excel files using the xlsx library:
- `readExcelSheet(filePath, sheetName)` - Read sheet as array of row objects
- `readExcelByIndex(filePath, sheetName)` - Read sheet as 2D array for positional access
- `listSheets(filePath)` - List all sheet names

### lib/csv-writer.ts

Writes CSV files with UTF-8 BOM for Excel compatibility. Also generates markdown reports.

### lib/mapping-loader.ts

Loads YAML mapping files and provides transformation functions:
- `mapStatus(excelValue)` - Map status value
- `mapTeamName(excelValue)` - Normalize team name
- `mapDepartmentName(excelValue)` - Normalize department name
- `mapOutcomeName(excelColumn)` - Map outcome column name
- `mapEffortSize(lmhValue)` - Convert L/M/H to T-shirt size
- `mapImpactSize(lmhValue)` - Convert L/M/H to T-shirt size

### lib/date-parser.ts

Parses flexible date formats:
- Excel serial date numbers (e.g., 44927)
- Quarter format (e.g., "Q1 2026", "2026 Q1")
- Year only (e.g., "2026")
- Year-month (e.g., "2026-06")
- ISO date (e.g., "2026-06-15")

### lib/conflict-resolver.ts

Interactive conflict resolution for existing projects during load. Prompts user for action when incoming data differs from database.

### lib/referential-checker.ts

Utility for loading referential lookups from the database. Currently unused but available for future needs.

## Mapping Files

### status-mapping.yaml

Maps Excel status values to database status names:

```yaml
statuses:
  "In progress": "In Progress"
  "WIP": "In Progress"
  "Done": "Completed"
  "To Do": "Ready"
  "": "Draft"
default: "Draft"
```

### team-mapping.yaml

Normalizes team and department names:

```yaml
teams:
  "CORPHRFIN": "Corp HR & Finance"
  "CUST": "Customer"
  "DATA": "Data & Middleware"

departments:
  "Impact on - CIAL": "Commercial"
  "Impact on - FIN": "Finance"
  "IS": "Information Systems"

auto_create_missing: true
```

### outcome-mapping.yaml

Maps Excel value score columns to outcome names:

```yaml
outcomes:
  "Safety": "Safety"
  "NPS": "NPS (Customer Satisfaction)"
  "EBITDA": "EBITDA"
  "Regulatory": "Regulatory Compliance"
```

### tshirt-mapping.yaml

Converts L/M/H effort and impact levels to T-shirt sizes:

```yaml
effort_sizes:
  "L": "S"    # Low effort -> Small
  "M": "M"    # Medium effort -> Medium
  "H": "L"    # High effort -> Large

impact_sizes:
  "L": "S"
  "M": "M"
  "H": "L"

default: "M"
```

## Excel Column Mapping

The extract script reads the "Input" sheet by column index:

| Index | Column Name | Maps To |
|-------|-------------|---------|
| 1 | Status | `projects.status` |
| 2 | Team | `projects.leadTeam` |
| 3 | IS Portfolio Ref ID | `projects.refId` |
| 4 | Project | `projects.name` |
| 5 | eurostar dpt Owner | `projects.departmentOwner` |
| 6 | Starting Date | `projects.startDate` |
| 8 | Delivery Date | `projects.endDate` |
| 13-18 | Safety, NPS, EBITDA, Regulatory | `project_values` |
| 21-28 | Team columns | `project_teams` (effort) |
| 32-42 | Impact on - columns | `project_impact` |
| 48 | Name of IS owner | `projects.isOwner` |
| 51-52 | Opex/Capex Budget | `budget` |
