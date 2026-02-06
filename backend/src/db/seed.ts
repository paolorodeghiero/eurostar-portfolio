import 'dotenv/config';
import { db, pool } from './index.js';
import {
  departments,
  teams,
  statuses,
  outcomes,
  costCenters,
  currencyRates,
  committeeThresholds,
  costTshirtThresholds,
  competenceMonthPatterns,
  projectIdCounters,
  projects,
  projectTeams,
  projectValues,
  projectChangeImpact,
  budgetLines,
  projectBudgetAllocations,
  receipts,
  invoices,
  auditLog,
  alertConfig,
} from './schema.js';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
  // Phase 4 governance tables first
  await db.delete(auditLog);
  await db.delete(alertConfig);
  // Phase 3 financial tables
  await db.delete(invoices);
  await db.delete(receipts);
  await db.delete(projectBudgetAllocations);
  await db.delete(budgetLines);
  // Phase 2 project tables
  await db.delete(projectChangeImpact);
  await db.delete(projectValues);
  await db.delete(projectTeams);
  await db.delete(projects);
  await db.delete(projectIdCounters);
  // Referential tables
  await db.delete(teams);
  await db.delete(departments);
  await db.delete(statuses);
  await db.delete(outcomes);
  await db.delete(costCenters);
  await db.delete(currencyRates);
  await db.delete(committeeThresholds);
  await db.delete(costTshirtThresholds);
  await db.delete(competenceMonthPatterns);

  // Departments
  console.log('Creating departments...');
  const [iseDept, trainsDept, stationsDept, commercialDept, financeDept] = await db
    .insert(departments)
    .values([
      { name: 'Information Systems' },
      { name: 'Trains & Operations' },
      { name: 'Stations & Customer Experience' },
      { name: 'Commercial & Revenue' },
      { name: 'Finance & Corporate' },
    ])
    .returning();

  // Teams
  console.log('Creating teams...');
  await db.insert(teams).values([
    // Information Systems teams
    { name: 'Digital Platforms', description: 'Web & mobile applications', departmentId: iseDept.id },
    { name: 'Data & Analytics', description: 'BI, reporting, and data engineering', departmentId: iseDept.id },
    { name: 'Infrastructure', description: 'Cloud, networks, and security', departmentId: iseDept.id },
    { name: 'Enterprise Systems', description: 'ERP, CRM, and core systems', departmentId: iseDept.id },
    // Trains & Operations teams
    { name: 'Fleet Management', description: 'Train maintenance and operations', departmentId: trainsDept.id },
    { name: 'Scheduling', description: 'Timetables and crew planning', departmentId: trainsDept.id },
    // Stations teams
    { name: 'Lounge Services', description: 'Business Premier lounges', departmentId: stationsDept.id },
    { name: 'Border Control', description: 'Customs and immigration systems', departmentId: stationsDept.id },
    // Commercial teams
    { name: 'Revenue Management', description: 'Pricing and yield optimization', departmentId: commercialDept.id },
    { name: 'Distribution', description: 'Channels and partnerships', departmentId: commercialDept.id },
    // Finance teams
    { name: 'Financial Planning', description: 'Budgeting and forecasting', departmentId: financeDept.id },
    { name: 'Procurement', description: 'Vendor management and contracts', departmentId: financeDept.id },
  ]);

  // Statuses
  console.log('Creating statuses...');
  await db.insert(statuses).values([
    { name: 'Draft', color: '#9CA3AF', displayOrder: 1 },
    { name: 'Ready', color: '#3B82F6', displayOrder: 2 },
    { name: 'In Progress', color: '#F59E0B', displayOrder: 3 },
    { name: 'On Hold', color: '#EF4444', displayOrder: 4 },
    { name: 'Completed', color: '#10B981', displayOrder: 5 },
    { name: 'Cancelled', color: '#6B7280', displayOrder: 6 },
  ]);

  // Outcomes (company strategic objectives)
  console.log('Creating outcomes...');
  await db.insert(outcomes).values([
    {
      name: 'Punctuality',
      score1Example: 'No impact on train punctuality',
      score2Example: 'Minor improvement to internal processes',
      score3Example: 'Measurable improvement to departure times',
      score4Example: 'Significant reduction in delays',
      score5Example: 'Transformational impact on overall punctuality KPIs',
    },
    {
      name: 'People Engagement',
      score1Example: 'No impact on employee experience',
      score2Example: 'Minor improvement to specific team workflows',
      score3Example: 'Improved collaboration across teams',
      score4Example: 'Significant boost to employee satisfaction',
      score5Example: 'Transformational change in company culture',
    },
    {
      name: 'EBITDA',
      score1Example: 'No financial impact',
      score2Example: 'Minor cost savings (<€50k/year)',
      score3Example: 'Moderate savings or revenue (€50k-€200k/year)',
      score4Example: 'Significant impact (€200k-€1M/year)',
      score5Example: 'Major financial impact (>€1M/year)',
    },
    {
      name: 'NPS (Customer Satisfaction)',
      score1Example: 'No impact on customer experience',
      score2Example: 'Minor improvement to specific touchpoint',
      score3Example: 'Noticeable improvement in customer journey',
      score4Example: 'Significant NPS improvement expected',
      score5Example: 'Transformational customer experience change',
    },
    {
      name: 'Safety',
      score1Example: 'No safety impact',
      score2Example: 'Minor safety documentation improvement',
      score3Example: 'Enhanced safety monitoring',
      score4Example: 'Significant risk reduction',
      score5Example: 'Critical safety system implementation',
    },
    {
      name: 'Regulatory Compliance',
      score1Example: 'No regulatory impact',
      score2Example: 'Minor compliance documentation',
      score3Example: 'Addresses specific regulatory requirement',
      score4Example: 'Major compliance milestone',
      score5Example: 'Critical regulatory obligation',
    },
  ]);

  // Cost Centers
  console.log('Creating cost centers...');
  await db.insert(costCenters).values([
    { code: 'CC-ISE-001', description: 'IT General' },
    { code: 'CC-ISE-002', description: 'IT Infrastructure' },
    { code: 'CC-ISE-003', description: 'IT Applications' },
    { code: 'CC-ISE-004', description: 'IT Data & Analytics' },
    { code: 'CC-OPS-001', description: 'Operations General' },
    { code: 'CC-OPS-002', description: 'Fleet Systems' },
    { code: 'CC-COM-001', description: 'Commercial Systems' },
    { code: 'CC-FIN-001', description: 'Finance Systems' },
    { code: 'CC-COR-001', description: 'Corporate & Shared' },
  ]);

  // Currency Rates (EUR as base)
  console.log('Creating currency rates...');
  const today = new Date();
  await db.insert(currencyRates).values([
    { fromCurrency: 'GBP', toCurrency: 'EUR', rate: '1.170000', validFrom: today.toISOString().split('T')[0] },
    { fromCurrency: 'EUR', toCurrency: 'GBP', rate: '0.854700', validFrom: today.toISOString().split('T')[0] },
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: '0.920000', validFrom: today.toISOString().split('T')[0] },
    { fromCurrency: 'EUR', toCurrency: 'USD', rate: '1.086957', validFrom: today.toISOString().split('T')[0] },
  ]);

  // Committee Thresholds (Engagement Committee activation)
  console.log('Creating committee thresholds...');
  await db.insert(committeeThresholds).values([
    // EUR thresholds
    { minAmount: '0', maxAmount: '50000', level: 'not_necessary', currency: 'EUR' },
    { minAmount: '50000', maxAmount: '200000', level: 'optional', currency: 'EUR' },
    { minAmount: '200000', maxAmount: null, level: 'mandatory', currency: 'EUR' },
    // GBP thresholds (converted from EUR at ~0.85 rate)
    { minAmount: '0', maxAmount: '42500', level: 'not_necessary', currency: 'GBP' },
    { minAmount: '42500', maxAmount: '170000', level: 'optional', currency: 'GBP' },
    { minAmount: '170000', maxAmount: null, level: 'mandatory', currency: 'GBP' },
  ]);

  // Cost T-shirt Thresholds
  console.log('Creating cost T-shirt thresholds...');
  await db.insert(costTshirtThresholds).values([
    { size: 'XS', maxAmount: '10000', currency: 'EUR' },
    { size: 'S', maxAmount: '50000', currency: 'EUR' },
    { size: 'M', maxAmount: '150000', currency: 'EUR' },
    { size: 'L', maxAmount: '500000', currency: 'EUR' },
    { size: 'XL', maxAmount: '1000000', currency: 'EUR' },
    { size: 'XXL', maxAmount: '999999999', currency: 'EUR' },
  ]);

  // Competence Month Patterns (regex to extract month from invoice descriptions)
  console.log('Creating competence month patterns...');
  await db.insert(competenceMonthPatterns).values([
    { company: 'THIF', pattern: '(\\d{2})/(\\d{4})', description: 'Format: MM/YYYY' },
    { company: 'THIF', pattern: '(\\w+)\\s+(\\d{4})', description: 'Format: Month YYYY (e.g., January 2024)' },
    { company: 'EIL', pattern: '(\\d{4})-(\\d{2})', description: 'Format: YYYY-MM' },
    { company: 'EIL', pattern: 'Q([1-4])\\s*(\\d{4})', description: 'Format: Q1 2024 (quarterly)' },
  ]);

  // Project ID Counters
  console.log('Creating project ID counters...');
  await db.insert(projectIdCounters).values([{ year: 2026, lastId: 3 }]);

  // Statuses query for ID lookup
  const statusList = await db.select().from(statuses);
  const draftStatus = statusList.find((s) => s.name === 'Draft');
  const inProgressStatus = statusList.find((s) => s.name === 'In Progress');
  const readyStatus = statusList.find((s) => s.name === 'Ready');

  // Teams query for ID lookup
  const teamList = await db.select().from(teams);
  const digitalTeam = teamList.find((t) => t.name === 'Digital Platforms');
  const dataTeam = teamList.find((t) => t.name === 'Data & Analytics');
  const infraTeam = teamList.find((t) => t.name === 'Infrastructure');
  const revenueTeam = teamList.find((t) => t.name === 'Revenue Management');

  // Outcomes query for ID lookup
  const outcomeList = await db.select().from(outcomes);

  // Cost centers query for ID lookup
  const costCenterList = await db.select().from(costCenters);
  const itGeneralCC = costCenterList.find((c) => c.code === 'CC-ISE-001');
  const itAppsCC = costCenterList.find((c) => c.code === 'CC-ISE-003');
  const itDataCC = costCenterList.find((c) => c.code === 'CC-ISE-004');

  // Projects
  console.log('Creating projects...');
  const [project1, project2, project3] = await db
    .insert(projects)
    .values([
      {
        projectId: 'PRJ-2026-00001',
        name: 'Customer Portal Redesign',
        statusId: inProgressStatus?.id,
        startDate: '2026-01-15',
        endDate: '2026-06-30',
        leadTeamId: digitalTeam!.id,
        projectManager: 'Alice Martin',
        isOwner: 'Bob Wilson',
        sponsor: 'Carol Davis',
        opexBudget: '75000.00',
        capexBudget: '25000.00',
        budgetCurrency: 'EUR',
        reportCurrency: 'EUR',
        costTshirt: 'M',
      },
      {
        projectId: 'PRJ-2026-00002',
        name: 'Real-Time Analytics Dashboard',
        statusId: readyStatus?.id,
        startDate: '2026-02-01',
        endDate: '2026-08-31',
        leadTeamId: dataTeam!.id,
        projectManager: 'David Chen',
        isOwner: 'Emily Brown',
        sponsor: 'Frank Miller',
        opexBudget: '120000.00',
        capexBudget: '80000.00',
        budgetCurrency: 'EUR',
        reportCurrency: 'EUR',
        costTshirt: 'L',
      },
      {
        projectId: 'PRJ-2026-00003',
        name: 'Cloud Migration Phase 2',
        statusId: draftStatus?.id,
        startDate: '2026-03-01',
        endDate: '2026-12-31',
        leadTeamId: infraTeam!.id,
        projectManager: 'Grace Lee',
        isOwner: 'Henry Taylor',
        sponsor: 'Isabel Garcia',
        opexBudget: '300000.00',
        capexBudget: '500000.00',
        budgetCurrency: 'EUR',
        reportCurrency: 'GBP',
        costTshirt: 'XL',
      },
    ])
    .returning();

  // Project Teams
  console.log('Creating project teams...');
  await db.insert(projectTeams).values([
    // Project 1: Customer Portal Redesign
    { projectId: project1.id, teamId: digitalTeam!.id, effortSize: 'L', isLead: true },
    { projectId: project1.id, teamId: dataTeam!.id, effortSize: 'S', isLead: false },
    // Project 2: Real-Time Analytics Dashboard
    { projectId: project2.id, teamId: dataTeam!.id, effortSize: 'XL', isLead: true },
    { projectId: project2.id, teamId: digitalTeam!.id, effortSize: 'M', isLead: false },
    { projectId: project2.id, teamId: infraTeam!.id, effortSize: 'S', isLead: false },
    // Project 3: Cloud Migration Phase 2
    { projectId: project3.id, teamId: infraTeam!.id, effortSize: 'XXL', isLead: true },
    { projectId: project3.id, teamId: dataTeam!.id, effortSize: 'L', isLead: false },
    { projectId: project3.id, teamId: digitalTeam!.id, effortSize: 'M', isLead: false },
  ]);

  // Project Values (scores for outcomes)
  console.log('Creating project values...');
  const projectValueData = [];
  for (const project of [project1, project2, project3]) {
    for (const outcome of outcomeList) {
      projectValueData.push({
        projectId: project.id,
        outcomeId: outcome.id,
        score: Math.floor(Math.random() * 5) + 1, // Random 1-5
        justification: `Impact on ${outcome.name} for ${project.name}`,
      });
    }
  }
  await db.insert(projectValues).values(projectValueData);

  // Project Change Impact
  console.log('Creating project change impact...');
  await db.insert(projectChangeImpact).values([
    { projectId: project1.id, teamId: revenueTeam!.id, impactSize: 'M' },
    { projectId: project2.id, teamId: revenueTeam!.id, impactSize: 'L' },
    { projectId: project2.id, teamId: digitalTeam!.id, impactSize: 'S' },
    { projectId: project3.id, teamId: dataTeam!.id, impactSize: 'XL' },
  ]);

  // Budget Lines
  console.log('Creating budget lines...');
  const [budgetLine1, budgetLine2, budgetLine3, budgetLine4] = await db
    .insert(budgetLines)
    .values([
      {
        company: 'THIF',
        departmentId: iseDept.id,
        costCenterId: itGeneralCC!.id,
        lineValue: 'Digital Transformation 2026',
        lineAmount: '250000.00',
        currency: 'EUR',
        type: 'OPEX',
        fiscalYear: 2026,
      },
      {
        company: 'THIF',
        departmentId: iseDept.id,
        costCenterId: itAppsCC!.id,
        lineValue: 'Application Development',
        lineAmount: '180000.00',
        currency: 'EUR',
        type: 'OPEX',
        fiscalYear: 2026,
      },
      {
        company: 'THIF',
        departmentId: iseDept.id,
        costCenterId: itDataCC!.id,
        lineValue: 'Data Platform Investment',
        lineAmount: '350000.00',
        currency: 'EUR',
        type: 'CAPEX',
        fiscalYear: 2026,
      },
      {
        company: 'EIL',
        departmentId: iseDept.id,
        costCenterId: itGeneralCC!.id,
        lineValue: 'Infrastructure Modernization',
        lineAmount: '500000.00',
        currency: 'GBP',
        type: 'CAPEX',
        fiscalYear: 2026,
      },
    ])
    .returning();

  // Project Budget Allocations
  console.log('Creating project budget allocations...');
  await db.insert(projectBudgetAllocations).values([
    { projectId: project1.id, budgetLineId: budgetLine1.id, allocationAmount: '50000.00' },
    { projectId: project1.id, budgetLineId: budgetLine2.id, allocationAmount: '25000.00' },
    { projectId: project2.id, budgetLineId: budgetLine1.id, allocationAmount: '80000.00' },
    { projectId: project2.id, budgetLineId: budgetLine3.id, allocationAmount: '80000.00' },
    { projectId: project3.id, budgetLineId: budgetLine3.id, allocationAmount: '200000.00' },
    { projectId: project3.id, budgetLineId: budgetLine4.id, allocationAmount: '300000.00' },
  ]);

  // Receipts
  console.log('Creating receipts...');
  await db.insert(receipts).values([
    {
      projectId: project1.id,
      receiptNumber: 'RCP-2026-001',
      company: 'THIF',
      purchaseOrder: 'PO-2026-001',
      amount: '12500.00',
      currency: 'EUR',
      receiptDate: '2026-01-20',
      description: 'Design consultation services',
    },
    {
      projectId: project1.id,
      receiptNumber: 'RCP-2026-002',
      company: 'THIF',
      purchaseOrder: 'PO-2026-002',
      amount: '8750.00',
      currency: 'EUR',
      receiptDate: '2026-02-01',
      description: 'UX research tools license',
    },
    {
      projectId: project2.id,
      receiptNumber: 'RCP-2026-003',
      company: 'EIL',
      purchaseOrder: 'PO-2026-003',
      amount: '25000.00',
      currency: 'EUR',
      receiptDate: '2026-02-05',
      description: 'Analytics platform setup',
    },
  ]);

  // Invoices
  console.log('Creating invoices...');
  await db.insert(invoices).values([
    {
      projectId: project1.id,
      company: 'THIF',
      invoiceNumber: 'INV-2026-001',
      purchaseOrder: 'PO-2026-001',
      amount: '15000.00',
      currency: 'EUR',
      invoiceDate: '2026-01-25',
      description: 'Development services 01/2026',
      competenceMonth: '2026-01',
      competenceMonthExtracted: true,
    },
    {
      projectId: project1.id,
      company: 'THIF',
      invoiceNumber: 'INV-2026-002',
      purchaseOrder: 'PO-2026-002',
      amount: '18500.00',
      currency: 'EUR',
      invoiceDate: '2026-02-03',
      description: 'Ongoing development February 2026',
      competenceMonth: '2026-02',
      competenceMonthExtracted: true,
    },
    {
      projectId: project2.id,
      company: 'EIL',
      invoiceNumber: 'INV-2026-003',
      purchaseOrder: 'PO-2026-003',
      amount: '32000.00',
      currency: 'EUR',
      invoiceDate: '2026-02-01',
      description: 'Data engineering contract',
      competenceMonth: null,
      competenceMonthExtracted: false,
    },
    {
      projectId: project3.id,
      company: 'THIF',
      invoiceNumber: 'INV-2026-004',
      purchaseOrder: 'PO-2026-004',
      amount: '75000.00',
      currency: 'EUR',
      invoiceDate: '2026-01-31',
      description: 'Cloud infrastructure Q1 2026',
      competenceMonth: '2026-01',
      competenceMonthExtracted: true,
    },
  ]);

  // Alert Configuration
  console.log('Creating alert configuration...');
  await db.insert(alertConfig).values([
    {
      type: 'overdue',
      enabled: true,
      budgetThresholdPercent: null, // Not applicable for overdue
    },
    {
      type: 'budget_limit',
      enabled: true,
      budgetThresholdPercent: 90, // Alert at 90% budget used
    },
  ]);

  console.log('\n✅ Seed completed successfully!');
  console.log('\nCreated:');
  console.log('  - 5 departments');
  console.log('  - 12 teams');
  console.log('  - 6 statuses');
  console.log('  - 6 outcomes');
  console.log('  - 9 cost centers');
  console.log('  - 4 currency rates');
  console.log('  - 6 committee thresholds (EUR + GBP)');
  console.log('  - 6 cost T-shirt thresholds');
  console.log('  - 4 competence month patterns');
  console.log('  - 3 projects');
  console.log('  - 8 project team assignments');
  console.log('  - 18 project value scores');
  console.log('  - 4 change impact entries');
  console.log('  - 4 budget lines');
  console.log('  - 6 budget allocations');
  console.log('  - 3 receipts');
  console.log('  - 4 invoices');
  console.log('  - 2 alert configurations');

  await pool.end();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
