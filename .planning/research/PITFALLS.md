# Pitfalls Research

**Domain:** IT Portfolio Management Tool
**Researched:** 2026-02-03
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Over-Complexity That Blocks Adoption

**What goes wrong:**
Organizations build portfolio management tools with extensive features, dozens of metrics, and complex workflows that overwhelm users. The tool becomes something to fight against rather than work with, leading to shadow spreadsheets, incomplete data entry, and eventual abandonment.

**Why it happens:**
Teams try to capture every possible metric and scenario upfront, believing comprehensive = valuable. The fear of "what if we need this later?" drives feature creep during initial design.

**How to avoid:**
- Start with 5-7 core metrics maximum, not 30+
- Implement a "crawl, walk, run" approach: basic scoring → budget tracking → advanced analytics
- Make every feature justify itself: "Will users enter this data accurately and consistently?"
- Eurostar context: Low volume means you can afford simplicity - optimize for data quality over feature quantity

**Warning signs:**
- Project managers complaining about "too many fields to fill"
- Intake forms taking 30+ minutes to complete
- Multiple spreadsheets existing outside the tool
- Users asking "which fields are actually required?"
- Demo sessions focusing on features rather than workflows

**Phase to address:**
Phase 1 (Foundation) - Establish minimum viable scoring dimensions and validate with real project intake before building additional features.

---

### Pitfall 2: Scoring Criteria That Don't Differentiate

**What goes wrong:**
Multi-dimensional scoring systems produce nearly identical scores for every project, making prioritization meaningless. Questions combine multiple attributes ("strategic value, user impact, and complexity") so everything rates "medium-high," or lack of anchor points means one evaluator gives 4/10 while another gives 8/10 for identical characteristics.

**Why it happens:**
Criteria are designed in isolation without testing against real projects. Teams create questions that sound comprehensive but measure multiple concepts simultaneously, or use subjective scales without defining what each number means.

**How to avoid:**
- Each scoring dimension must assess ONLY ONE concept
- Define explicit anchor points: "Strategic Alignment: 1=no strategy link, 5=directly enables strategic objective, 10=business-critical initiative"
- Test scoring on 5-10 historical projects before implementation
- Eurostar context: With stable IDs for referential management, track which projects score similarly and refine dimensions until clear differentiation emerges

**Warning signs:**
- 80%+ of projects scoring between 6-8 on every dimension
- Portfolio reviews where "everything is important"
- Stakeholders disagreeing wildly on same project's score
- Inability to rank projects when budgets are constrained
- Constant recalibration of scoring during governance meetings

**Phase to address:**
Phase 1 (Foundation) - Define and validate scoring dimensions with sample projects. Phase 2 should add audit history to track score changes and identify dimensions needing refinement.

---

### Pitfall 3: Budget Tracking Without Source Currency

**What goes wrong:**
Teams store budget figures in a single reporting currency (e.g., converting EUR to GBP at entry time). When exchange rates change or audits require source verification, the original values are lost. Manual re-conversion with different rates creates discrepancies between financial systems and the portfolio tool.

**Why it happens:**
"We only report in GBP, so store it in GBP" seems logical and avoids complexity. Teams don't anticipate exchange rate fluctuations, cross-border audits, or reconciliation with finance systems that maintain source currency.

**How to avoid:**
- ALWAYS store amounts in source currency with currency code (amount: 50000, currency: 'EUR')
- Store exchange rate and converted amount at time of entry for historical accuracy
- Convert to reporting currency ONLY at query/display time for current views
- Maintain exchange rate history table for audit trail
- Eurostar context: With multiple European operations, source currency preservation is critical for finance reconciliation

**Warning signs:**
- Discrepancies when comparing to finance system reports
- Inability to explain "why did this budget change?" when rates fluctuate
- Manual spreadsheet conversions parallel to the tool
- Finance team maintaining separate records
- Missing audit trail for currency conversions

**Phase to address:**
Phase 1 (Foundation) - Implement multi-currency data model from the start. Retrofitting is painful and risks data loss. Power BI integration phase must include current-rate conversion functions.

---

### Pitfall 4: Actuals Import Without Reconciliation

**What goes wrong:**
The tool imports actuals from external systems but lacks mechanisms to detect discrepancies, duplicates, or missing data. Teams discover budget vs. actuals variance is unreliable only when presenting to executives, undermining trust in the entire system.

**Why it happens:**
Import functionality focuses on "getting data in" without validation. Teams assume source systems are always correct and complete. Edge cases (delayed invoices, currency mismatches, cost center changes) aren't considered until production.

**How to avoid:**
- Implement import validation: expected vs. received record counts, sum checks, currency consistency
- Flag records that can't be matched to projects (using stable IDs)
- Create reconciliation dashboard showing import health metrics
- Maintain import audit log: who imported, when, what changed
- Alert on anomalies: actuals exceeding budget by >20%, sudden spikes, missing monthly data
- Eurostar context: Low volume means reconciliation can be human-reviewed; build visible flags rather than silent failures

**Warning signs:**
- "The numbers look wrong but we're not sure why"
- Finance team doesn't trust portfolio reports
- Manual spot-checks revealing discrepancies
- No one knows when actuals were last imported
- Budget variance reports showing impossible patterns

**Phase to address:**
Phase 2 (Actuals Integration) - Build reconciliation as core feature, not afterthought. Don't go live with actuals import until validation and alerting are production-ready.

---

### Pitfall 5: Governance Workflow That Becomes Bottleneck

**What goes wrong:**
The approval process is too rigid (single approver on vacation blocks everything) or too complex (6 steps with unclear ownership). Projects sit in "pending approval" for weeks. Teams bypass the workflow, undercutting governance entirely.

**Why it happens:**
Workflow designed to mirror ideal-state organizational chart rather than how work actually happens. Fear of insufficient oversight leads to overly cautious multi-stage approvals. No consideration for vacation coverage, urgent requests, or delegation.

**How to avoid:**
- Maximum 3 approval stages for standard projects
- Build delegation: approvers can assign temporary deputies
- Include SLA tracking: flag items pending >5 business days
- Emergency fast-track path with post-approval audit
- Role-based flexibility: portfolio manager can reassign stuck items
- Eurostar context: Low volume means each delay is highly visible; optimize for throughput while maintaining accountability

**Warning signs:**
- Projects in "pending" state for >2 weeks
- Stakeholders emailing approvers directly to "check status"
- Verbal approvals with workflow updated later
- Governance meetings spent reviewing workflow rather than projects
- Project start dates delayed due to approval lag

**Phase to address:**
Phase 3 (Governance Workflow) - Prototype with paper workflows first to identify bottlenecks before building. Include monitoring and delegation from day one.

---

### Pitfall 6: Referential Integrity Without Cascade Rules

**What goes wrong:**
Projects reference cost centers, teams, business units via stable IDs (good!) but when a cost center is reorganized or a team is dissolved, hundreds of projects show broken references. The tool either blocks deletion entirely (causing stale data accumulation) or allows orphaned records (causing reporting errors).

**Why it happens:**
Foreign key constraints implemented without considering organizational change patterns. Teams focus on preventing accidental deletion but don't build workflows for intentional reorganization.

**How to avoid:**
- Define cascade rules per relationship type:
  - Cost center changes: update all projects to new cost center, log in audit history
  - Team dissolution: require reassignment before deletion
  - Strategic goal retirement: projects can maintain historical reference with "archived" flag
- Build "impact analysis" view: "Deleting X affects 23 active projects"
- Distinguish between "soft delete" (archived, reportable historically) and "hard delete" (data error)
- Eurostar context: Stable IDs across reorganizations require thoughtful cascade design, not just database constraints

**Warning signs:**
- Inability to close old cost centers despite no active work
- "Unused" reference data lists growing indefinitely
- Manual queries to find "what uses this?"
- Reports breaking when reference data changes
- Database administrators manually fixing foreign key violations

**Phase to address:**
Phase 1 (Foundation) - Define referential rules during data modeling. Phase 4 (Referential Management) should build UI for impact analysis and managed transitions.

---

### Pitfall 7: Audit History That Obscures Rather Than Illuminates

**What goes wrong:**
Every field change generates an audit record, creating thousands of entries. Finding "who changed the budget from 100K to 150K?" requires sifting through noise: "status updated," "description typo fixed," "updated_at timestamp changed." Audit logs exist but are effectively unsearchable.

**Why it happens:**
"Log everything" seems like comprehensive audit strategy. Teams don't distinguish between material changes (budget, status, approvals) and routine updates (description edits, comments). No filtering, summarization, or highlight mechanisms.

**How to avoid:**
- Categorize changes by materiality:
  - Critical: budget, status, approval decisions, scoring
  - Standard: assignee, dates, descriptive fields
  - Minor: comments, tags, metadata
- Build filtered views: "Show material changes only"
- Summarize related changes: "Budget package updated (3 fields)" not 3 separate entries
- Include business context: "Budget increased due to scope expansion" not just "budget: 100000 → 150000"
- Add search/filter: by user, date range, field, project, change type
- Eurostar context: Low volume means audits are human-reviewed; optimize for investigator experience

**Warning signs:**
- Audit logs never reviewed except during incidents
- "Can you check who approved this?" takes 30 minutes to answer
- Export to spreadsheet required to analyze changes
- No one trusts the audit log to be useful
- Compliance audits require manual evidence gathering outside the tool

**Phase to address:**
Phase 5 (Audit History) - Design for audit use cases (compliance review, change investigation, trend analysis) not just "we log everything."

---

### Pitfall 8: Power BI Integration as Afterthought

**What goes wrong:**
The portfolio tool stores data in application-optimized format (JSON fields, dynamic schemas, deeply nested structures). When connecting Power BI, report developers spend 80% of time wrangling data structure instead of building insights. Reports are brittle, breaking with schema changes.

**Why it happens:**
Application development prioritizes developer convenience (flexible JSON) without considering reporting needs. Power BI integration is "we'll add that later" until executives demand dashboards.

**How to avoid:**
- Design PostgreSQL schema for reporting from start:
  - Normalized tables for dimensions (projects, cost centers, teams)
  - Fact tables for metrics (budgets, actuals, scores)
  - Avoid JSON columns for reportable data
  - Include surrogate keys for slowly-changing dimensions
- Create database views optimizing common report patterns
- Establish schema change process: review reporting impact before altering tables
- Provide Power BI semantic model alongside the tool
- Eurostar context: Power BI integration is key requirement; schema must serve both application and analytics

**Warning signs:**
- Power BI developers requesting "export to CSV"
- Complex Power Query M code transforming basic data
- Reports breaking after routine application updates
- Multiple versions of "truth" between app UI and dashboards
- Inability to answer "why don't these numbers match?"

**Phase to address:**
Phase 1 (Foundation) - Design database schema with Power BI requirements. Phase 6 (Power BI Integration) should be connecting to report-ready structure, not building ETL.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing converted currency only | Simpler data model, fewer fields | Cannot audit conversions, finance reconciliation fails | Never - source currency is fundamental |
| Generic "notes" field instead of structured comments | Fast to implement | Impossible to search, summarize, or report | Only for true unstructured user notes |
| Storing user emails instead of user IDs | Works with EntraID email lookup | Email changes break audit history | Never - use stable EntraID object IDs |
| Single approval stage "to start simple" | Faster initial rollout | Difficult to add stages later without breaking history | Acceptable for MVP if next phase adds workflow |
| Manual actuals entry "until we build import" | Avoids integration complexity | Users never trust manual data, import never prioritized | Only with explicit commitment to Phase 2 import |
| Scoring dimensions without weights | Equal weights easier to explain | Can't reflect relative importance | Acceptable for Phase 1 if Phase 2 adds weighting |
| Embedding reporting logic in application | Single codebase | Power BI can't replicate calculations | Never - calculations belong in database views |
| Soft deletes without cleanup process | Preserves history | Database grows with obsolete data | Acceptable if Phase 4 includes archival process |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| EntraID Authentication | Storing EntraID tokens long-term | Validate tokens per-request, store only EntraID object ID |
| Finance System Actuals | Assuming 1:1 project mapping | Build unmatched transaction queue; some imports require human resolution |
| Power BI Semantic Model | Connecting directly to application tables | Create dedicated reporting views; isolate schema changes |
| Exchange Rate APIs | Caching rates indefinitely | Store historical rates with timestamps; flag when rates are >7 days stale |
| Email Notifications | Sending immediately on every change | Batch notifications; allow users to configure digest frequency |
| Document Storage | Storing files in PostgreSQL BLOBs | Use file storage service; store metadata and URIs in database |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all projects for dropdown lists | UI lag when selecting project | Implement autocomplete with search; paginate results | >500 projects |
| Recalculating scores on every page load | Slow dashboard rendering | Cache calculated scores; recalculate only on score changes | >200 projects |
| Joining audit history on every query | Slow list views | Audit history separate; load on-demand | >10K audit records |
| N+1 queries for project details | Slow portfolio views | Use JOIN or batch loading | >100 projects in view |
| Full-text search without indexes | Search takes seconds | PostgreSQL full-text indexes on searchable fields | >1K projects |
| Unbounded actuals queries | Power BI reports timeout | Filter by date range in view layer; default to current FY | >50K actuals records |

**Eurostar Context:** Low volume (<200 projects) means these traps are unlikely in Phase 1-3, but design patterns now to avoid technical debt if volume grows.

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Role-based access without row-level security | Users see all projects regardless of permission | Implement row filters: users see only projects where they're stakeholder/approver/owner |
| Storing budget targets before public announcement | Strategic information leaks | Mark projects as "confidential" with separate access control; audit who views |
| Audit log accessible to project owners | Users see who questioned their budget | Audit access restricted to portfolio managers and auditors |
| Approval history editable after decision | Governance record tampering | Approval records immutable once committed; cancellation creates new record |
| Exported reports without watermarks | Stale data circulated as current | Add "Generated: 2026-02-03" to all exports; Power BI reports show refresh time |
| Referential data changes without approval | Cost center reassignment hides budget | Require approval for bulk project updates; log who authorized |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring complete project details at intake | Project ideas die in intake form; users avoid the tool | Minimal intake (title, sponsor, summary); enrich later during approval |
| Showing raw database IDs in UI | Confusion, poor user experience | Display human-readable names with IDs hidden; use stable IDs internally |
| Budget variance without context | Red numbers cause panic without explanation | Show trend, indicate if variance is timing vs. real issue, link to actuals detail |
| Scoring dimensions without help text | Inconsistent interpretation | Inline examples: "Strategic Alignment: 10 = enables digital transformation initiative" |
| Approval notifications without context | "Project X needs approval" → user must login to see details | Email includes project summary, budget, scoring, reason for submission |
| Power BI dashboards showing stale data | Decisions made on outdated information | Prominent "Last refreshed: 2 hours ago" indicator |
| No visual distinction between draft/active/closed | Users edit closed projects thinking they're active | Color coding, status badges, prevent edits on closed projects |
| Form validation only on submit | User fills 20 fields, clicks submit, "Error: invalid date" | Inline validation; mark required fields; show errors as user types |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Multi-dimensional scoring:** Often missing validation that dimensions differentiate projects — test on 10 historical projects and verify score distribution
- [ ] **Budget tracking:** Often missing currency precision handling (should store as integers, e.g., cents) — verify no floating-point errors with 33.33% splits
- [ ] **Actuals import:** Often missing error handling and reconciliation — verify behavior when source data has duplicates, missing projects, or null values
- [ ] **Governance workflow:** Often missing delegation and vacation coverage — test what happens when approver is unavailable
- [ ] **Referential management:** Often missing cascade rules and impact analysis — verify behavior when deleting referenced cost center
- [ ] **Audit history:** Often missing filtering and search — verify you can answer "who changed budget on Project X?" in <30 seconds
- [ ] **Power BI integration:** Often missing semantic model and documentation — verify report developer can create new dashboard without schema documentation
- [ ] **EntraID auth:** Often missing group-based permissions — verify role assignment works when user is added to EntraID group
- [ ] **Currency conversion:** Often missing historical rate preservation — verify reports show same numbers when re-run 6 months later
- [ ] **Search functionality:** Often missing partial match and relevance ranking — verify searching "digital" finds "Digital Transformation Initiative"

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Over-complexity blocking adoption | MEDIUM | 1. Survey users: which features never used? 2. Create "simplified mode" hiding advanced features 3. Communicate: "We heard you, simpler now" |
| Scoring doesn't differentiate | LOW | 1. Analyze score distribution by dimension 2. Refine anchor points with stakeholders 3. Re-score 20 recent projects as calibration |
| Currency stored without source | HIGH | 1. Audit: can you recover source from finance system? 2. Mark all existing data as GBP-sourced 3. Fix schema 4. Import historical source currency |
| Actuals import without reconciliation | MEDIUM | 1. Freeze imports 2. Build validation layer 3. Re-import last 3 months with validation 4. Document issues found |
| Governance workflow bottleneck | LOW | 1. Add delegation immediately 2. Audit pending items: bulk-approve or reassign 3. Add SLA monitoring |
| Referential integrity breaks | MEDIUM | 1. Build impact analysis query 2. Identify all orphaned references 3. Create data cleanup project 4. Implement cascade rules before resuming changes |
| Audit history unusable | LOW | 1. Add filtering UI to existing data 2. Categorize historical changes retroactively 3. Document common audit queries |
| Power BI integration brittle | HIGH | 1. Create reporting views over existing tables 2. Migrate reports to views 3. Establish schema change governance 4. Publish semantic model |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Over-complexity | Phase 1: Foundation | User completes project intake in <10 minutes; no "is this really needed?" questions |
| Scoring doesn't differentiate | Phase 1: Foundation | 10 sample projects produce scores across full range; stakeholders agree on relative priority |
| Budget without source currency | Phase 1: Foundation | Schema review confirms multi-currency model; test data includes EUR, GBP, USD projects |
| Actuals import without reconciliation | Phase 2: Actuals Integration | Import test data with known errors; verify all detected and flagged |
| Governance workflow bottleneck | Phase 3: Governance Workflow | Test approver on vacation; verify delegate can approve; SLA alerts fire correctly |
| Referential integrity breaks | Phase 4: Referential Management | Delete test cost center; verify impact analysis shown, cascade handled correctly |
| Audit history unusable | Phase 5: Audit History | Portfolio manager answers "who approved this?" in <30 seconds from audit UI |
| Power BI integration brittle | Phase 6: Power BI Integration | Report developer creates new dashboard from semantic model without help |

## Sources

### Implementation Challenges & Lessons Learned
- [Common Mistakes to Avoid When Implementing IT Portfolio Management](https://www.linkedin.com/pulse/common-mistakes-avoid-when-implementing-portfolio-management-freda-7y4be)
- [IT Infrastructure Portfolio Management: What We've Learned](https://arche.global/blog/it-infrastructure-portfolio-management-here-s-what-we-ve-learned)
- [Best Practices for Effective Project Portfolio Management in 2026](https://www.itonics-innovation.com/blog/effective-project-portfolio-management)
- [Common mistakes in project portfolio management – How to avoid them?](https://erpsoftwareblog.com/2025/08/common-mistakes-in-project-portfolio-management-how-to-avoid-them/)

### Scoring & Prioritization Pitfalls
- [Avoiding the Many Pitfalls of Project Scoring in Project Prioritization](https://blog.planview.com/avoiding-the-many-pitfalls-of-project-scoring-in-project-prioritization/)
- [Project Prioritization Matrix: Avoid These 4 Common Mistakes](https://blog.transparentchoice.com/project-prioritization-matrix)
- [10 Signs You Have a Project Prioritization Problem](https://www.transparentchoice.com/blog/signs-of-poor-project-prioritization)
- [How to prioritize projects in 2026: best criteria and techniques](https://triskellsoftware.com/blog/project-prioritization/)

### Budget Tracking & Multi-Currency
- [Navigating the Challenges of Multi-Currency Financial Management](https://controllerscouncil.org/navigating-the-challenges-of-multi-currency-financial-management/)
- [Navigating multi-currency account reporting: a guide for FP&A managers](https://www.cubesoftware.com/blog/multi-currency-account)
- [Multi-Currency Reporting Complexities](https://fundcount.com/multi-currency-reporting-complexities/)

### Governance & Workflow
- [How to Implement Effective Project Portfolio Governance](https://prismppm.com/blog/project-portfolio-management/project-portfolio-governance/)
- [What Happens When Governance Fails](https://pmo365.com/blog/good-project-governance-what-happens-when-governance-goes-wrong)
- [Crafting An Effective Project Portfolio Management Governance](https://www.nordantech.com/en/blog/project-portfolio-management/crafting-an-effective-project-portfolio-management-governance-a-guide-for-pmos)

### Data Quality & Integration
- [Essential Data Integrity Best Practices for 2025](https://atlan.com/data-integrity-best-practices/)
- [What is Data Integrity? | IBM](https://www.ibm.com/think/topics/data-integrity)

### Tool Selection & Complexity
- [Best IT Portfolio Management Software 2026: A Complete Guide](https://www.bigtime.net/blogs/it-portfolio-management-software/)
- [Top 16 Project Portfolio Management Software Tools (2026)](https://productive.io/blog/project-portfolio-management-software/)

### Project Intake
- [5 common mistakes in IT project intake processes](https://eab.com/resources/blog/data-analytics-blog/5-mistakes-it-project-intake-processes/)
- [7 Ways to Improve Your Project Intake Process](https://regoconsulting.com/7-ways-to-improve-your-project-intake-process/)

### Power BI Integration
- [How to Create a Power BI Dashboard: Pros & Cons](https://www.projectmanager.com/blog/power-bi-dashboard)
- [Power BI for SharePoint Project and Portfolio Reporting](https://www.brightwork.com/blog/power-bi-sharepoint-project-portfolio-reporting)

---
*Pitfalls research for: Eurostar IT Portfolio Management Tool*
*Researched: 2026-02-03*
