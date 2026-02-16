# Import Mapping Configurations

This directory contains YAML mapping configurations for Excel-to-database imports.

## Purpose

Mapping files define how data from Excel columns maps to database entities and values. They enable:
- Normalization of inconsistent Excel data (e.g., "In Progress" → "in_progress")
- Mapping domain values to database IDs (e.g., status names → status table)
- T-shirt size translations (e.g., L/M/H → S/M/L)
- Team and department name resolution

## Files

- `status-mapping.yaml` - Maps Excel status values to database status names
- `team-mapping.yaml` - Maps Excel team names to database team entities
- `outcome-mapping.yaml` - Maps Excel value column headers to outcome names

## Format

### Status Mapping Example

```yaml
mappings:
  "In Progress": "In Progress"
  "On Hold": "On Hold"
  "Completed": "Completed"
  "Draft": "Draft"
  "Not Started": "Draft"
```

### Team Mapping Example

```yaml
mappings:
  "IS Architecture":
    name: "Architecture"
    department: "Information Systems"
  "IS Dev Team":
    name: "Development"
    department: "Information Systems"
```

### Outcome Mapping Example

```yaml
mappings:
  "Safety": "Safety"
  "NPS": "Customer Experience"
  "EBITDA": "Financial Performance"
  "Regulatory": "Regulatory Compliance"
```

## Usage

Import scripts load these mappings at runtime to validate and transform Excel data before database insertion.
