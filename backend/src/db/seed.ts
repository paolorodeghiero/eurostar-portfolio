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
} from './schema.js';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
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
    { minAmount: '0', maxAmount: '50000', level: 'not_necessary', currency: 'EUR' },
    { minAmount: '50000', maxAmount: '200000', level: 'optional', currency: 'EUR' },
    { minAmount: '200000', maxAmount: null, level: 'mandatory', currency: 'EUR' },
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

  console.log('\n✅ Seed completed successfully!');
  console.log('\nCreated:');
  console.log('  - 5 departments');
  console.log('  - 12 teams');
  console.log('  - 6 statuses');
  console.log('  - 6 outcomes');
  console.log('  - 9 cost centers');
  console.log('  - 4 currency rates');
  console.log('  - 3 committee thresholds');
  console.log('  - 6 cost T-shirt thresholds');
  console.log('  - 4 competence month patterns');

  await pool.end();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
