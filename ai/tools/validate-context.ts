#!/usr/bin/env ts-node
/**
 * Context Validation Tool
 *
 * Pre-commit validation script that ensures AI context documentation
 * is accurate and follows conventions.
 *
 * Usage:
 *   npx ts-node ai/tools/validate-context.ts [options]
 *
 * Options:
 *   --strict    Treat warnings as errors
 *   --format    Output format: text, json, markdown
 *   --verbose   Show detailed output
 *   --config    Custom config file path
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateContext, loadHierarchy } from './context-validator';
import type { ValidationResult, CLIOptions, ValidationSeverity } from './lib/types';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    format: 'text',
    verbose: false,
    strict: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as 'json' | 'text' | 'markdown';
    } else if (arg.startsWith('--config=')) {
      options.config = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    }
  }

  return options;
}

// ============================================================================
// Output Formatters
// ============================================================================

function formatText(result: ValidationResult, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('  AI Context Validation Report');
  lines.push('='.repeat(60));
  lines.push('');

  if (result.valid) {
    lines.push('  ✅ All validations passed!');
  } else {
    lines.push('  ❌ Validation failed');
  }

  lines.push('');
  lines.push(`  Errors:   ${result.summary.errors}`);
  lines.push(`  Warnings: ${result.summary.warnings}`);
  lines.push(`  Info:     ${result.summary.infos}`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('-'.repeat(60));
    lines.push('  Issues:');
    lines.push('-'.repeat(60));

    const groupedByFile = new Map<string, typeof result.issues>();
    for (const issue of result.issues) {
      const existing = groupedByFile.get(issue.file) || [];
      existing.push(issue);
      groupedByFile.set(issue.file, existing);
    }

    for (const [file, issues] of groupedByFile) {
      lines.push('');
      lines.push(`  📁 ${file}`);
      for (const issue of issues) {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        const location = issue.line ? `:${issue.line}` : '';
        lines.push(`     ${icon} [${issue.rule}] ${issue.message}${location}`);
        if (verbose && issue.suggestion) {
          lines.push(`        💡 ${issue.suggestion}`);
        }
      }
    }
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push(`  Completed at: ${result.timestamp}`);
  lines.push('='.repeat(60));
  lines.push('');

  return lines.join('\n');
}

function formatJson(result: ValidationResult): string {
  return JSON.stringify(result, null, 2);
}

function formatMarkdown(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('# AI Context Validation Report');
  lines.push('');
  lines.push(`**Status:** ${result.valid ? '✅ Passed' : '❌ Failed'}`);
  lines.push(`**Timestamp:** ${result.timestamp}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Type | Count |`);
  lines.push(`|------|-------|`);
  lines.push(`| Errors | ${result.summary.errors} |`);
  lines.push(`| Warnings | ${result.summary.warnings} |`);
  lines.push(`| Info | ${result.summary.infos} |`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('## Issues');
    lines.push('');

    const groupedByFile = new Map<string, typeof result.issues>();
    for (const issue of result.issues) {
      const existing = groupedByFile.get(issue.file) || [];
      existing.push(issue);
      groupedByFile.set(issue.file, existing);
    }

    for (const [file, issues] of groupedByFile) {
      lines.push(`### ${file}`);
      lines.push('');
      for (const issue of issues) {
        const badge =
          issue.severity === 'error'
            ? '🔴'
            : issue.severity === 'warning'
              ? '🟡'
              : '🔵';
        lines.push(`- ${badge} **${issue.rule}**: ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`  - 💡 *Suggestion:* ${issue.suggestion}`);
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  // Determine project root
  const projectRoot = path.resolve(__dirname, '../..');

  // Load hierarchy configuration
  const hierarchyPath = options.config || path.join(projectRoot, 'ai/config/context-hierarchy.yml');

  if (options.verbose) {
    console.log(`Project root: ${projectRoot}`);
    console.log(`Config path: ${hierarchyPath}`);
  }

  try {
    // Check if hierarchy file exists
    if (!fs.existsSync(hierarchyPath)) {
      console.error(`❌ Configuration file not found: ${hierarchyPath}`);
      process.exit(1);
    }

    // Load and validate
    const hierarchy = loadHierarchy(hierarchyPath);
    const result = await validateContext(projectRoot, hierarchy);

    // Apply strict mode
    if (options.strict && result.summary.warnings > 0) {
      result.valid = false;
    }

    // Format output
    let output: string;
    switch (options.format) {
      case 'json':
        output = formatJson(result);
        break;
      case 'markdown':
        output = formatMarkdown(result);
        break;
      default:
        output = formatText(result, options.verbose || false);
    }

    // Write output
    if (options.output) {
      fs.writeFileSync(options.output, output);
      console.log(`Report written to: ${options.output}`);
    } else {
      console.log(output);
    }

    // Exit with appropriate code
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
