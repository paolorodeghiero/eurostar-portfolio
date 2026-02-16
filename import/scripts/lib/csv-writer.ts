import { writeToPath } from '@fast-csv/format';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Write array of objects to CSV file with UTF-8 BOM
 */
export async function writeCsv<T extends Record<string, any>>(
  filePath: string,
  data: T[],
  options?: { headers?: string[] }
): Promise<void> {
  // Ensure directory exists
  mkdirSync(dirname(filePath), { recursive: true });

  return new Promise((resolve, reject) => {
    writeToPath(filePath, data, {
      headers: options?.headers ?? true,
      quoteColumns: true,
      writeBOM: true,  // UTF-8 BOM for Excel compatibility
    })
      .on('finish', resolve)
      .on('error', reject);
  });
}

interface ReportSection {
  title: string;
  items: string[];
}

interface ExtractionReport {
  title: string;
  timestamp: string;
  sourceFile: string;
  sections: ReportSection[];
  warnings: string[];
  summary: Record<string, number>;
}

/**
 * Write markdown extraction report
 */
export function writeReport(filePath: string, report: ExtractionReport): void {
  mkdirSync(dirname(filePath), { recursive: true });

  const lines: string[] = [
    `# ${report.title}`,
    '',
    `**Generated:** ${report.timestamp}`,
    `**Source:** ${report.sourceFile}`,
    '',
  ];

  // Summary
  lines.push('## Summary', '');
  lines.push('| Entity | Count |');
  lines.push('|--------|-------|');
  for (const [entity, count] of Object.entries(report.summary)) {
    lines.push(`| ${entity} | ${count} |`);
  }
  lines.push('');

  // Sections
  for (const section of report.sections) {
    lines.push(`## ${section.title}`, '');
    for (const item of section.items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  // Warnings
  if (report.warnings.length > 0) {
    lines.push('## Warnings', '');
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  writeFileSync(filePath, lines.join('\n'), 'utf8');
}
