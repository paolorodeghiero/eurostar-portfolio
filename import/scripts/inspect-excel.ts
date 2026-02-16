import { readExcelByIndex } from './lib/excel-reader.js';

const filePath = process.argv[2] || 'TPO Portfolio.xlsx';

console.log('Inspecting:', filePath);
const data = readExcelByIndex(filePath, 'Input');
console.log('\nTotal rows:', data.length);

const headerRow = data[1];
console.log('\nHeader row (first 55 columns):');
for (let i = 0; i < 55; i++) {
  const value = headerRow[i] ? String(headerRow[i]) : '(empty)';
  console.log(`  [${i}]: ${value}`);
}

console.log('\n\nFirst data row (row 2):');
const firstDataRow = data[2];
for (let i = 0; i < 55; i++) {
  const value = firstDataRow[i] ? String(firstDataRow[i]).substring(0, 30) : '(empty)';
  console.log(`  [${i}]: ${value}`);
}
