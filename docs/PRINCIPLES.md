# Documentation Principles

This documentation follows strict principles to ensure maintainability and accuracy.

## Core Principles

### DRY (Don't Repeat Yourself)
- Each concept is documented in exactly one place
- Cross-reference rather than duplicate information
- Use links to navigate between related documentation

### Avoid Hardcoding
- Reference file paths relatively when possible
- Use code examples extracted from the actual codebase
- Avoid embedding version numbers or configuration values that change

### Current State Only
- Document what **is**, not what **was** or **will be**
- No historical changelog entries
- No roadmap or future plans
- No "TODO" or "coming soon" sections

### No Next Steps
- Documentation describes completed, working functionality
- Implementation details for unfinished features belong in `.planning/`
- If something doesn't exist yet, don't document it here

## Structure Rules

### File Organization
- One topic per file
- Files are named with lowercase-kebab-case
- README.md serves as index for each directory
- Maximum depth of 3 levels

### Content Format
- Use H1 for document title only
- H2 for major sections
- H3 for subsections
- Use code blocks with language specifiers
- Tables for structured data
- Bullet lists for enumerations

### Cross-References
- Use relative links: `[Topic](./path/to/file.md)`
- Link to source code where relevant
- Avoid external links that may break

## Verification

Documentation accuracy is maintained through:
- Pre-commit hooks that verify documentation exists for changed files
- Automated checks that code examples compile
- Regular sweeps to remove stale content

## Scope Boundaries

### In Scope
- Architecture and design decisions
- API contracts and endpoints
- Component structure and usage
- Development setup and commands
- Configuration options

### Out of Scope (use `.planning/` instead)
- Implementation plans
- Debug sessions
- Phase execution details
- Quick task tracking
