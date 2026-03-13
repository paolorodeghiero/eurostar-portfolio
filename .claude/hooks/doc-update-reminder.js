#!/usr/bin/env node
/**
 * PostToolUse hook: Remind to update documentation when source files change
 *
 * Triggers after Edit/Write operations on source files to prompt
 * documentation review.
 */

const fs = require('fs');

// Read JSON input from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || '';

    // Source file patterns that should trigger doc reminder
    const sourcePatterns = [
      /frontend\/src\/.*\.(ts|tsx)$/,
      /backend\/src\/.*\.(ts)$/,
      /import\/scripts\/.*\.(ts)$/,
    ];

    // Check if edited file matches source patterns
    const isSourceFile = sourcePatterns.some(pattern => pattern.test(filePath.replace(/\\/g, '/')));

    if (isSourceFile) {
      // Determine which documentation might need updating
      let docHint = '';

      if (filePath.includes('routes')) {
        docHint = 'docs/api/ or docs/backend/routes.md';
      } else if (filePath.includes('schema')) {
        docHint = 'docs/architecture/database.md';
      } else if (filePath.includes('components')) {
        docHint = 'docs/frontend/components.md';
      } else if (filePath.includes('import')) {
        docHint = 'docs/import/README.md';
      } else if (filePath.includes('frontend')) {
        docHint = 'docs/frontend/';
      } else if (filePath.includes('backend')) {
        docHint = 'docs/backend/';
      }

      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: docHint
            ? `Source file modified. If this changes behavior or APIs, consider updating ${docHint}`
            : 'Source file modified. Consider if documentation needs updating.'
        }
      };

      console.log(JSON.stringify(output));
    }

    process.exit(0);
  } catch (err) {
    // Silent fail - don't block on hook errors
    process.exit(0);
  }
});
