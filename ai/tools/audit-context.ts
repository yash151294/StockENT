#!/usr/bin/env ts-node
/**
 * Context Coverage Audit Tool
 *
 * Audits documentation coverage across the codebase.
 *
 * Usage:
 *   npx ts-node ai/tools/audit-context.ts [options]
 *
 * Options:
 *   --format    Output format: text, json, markdown
 *   --output    Write report to file
 *   --verbose   Show detailed output
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { loadHierarchy, getHierarchyFiles } from './context-validator';
import type { AuditResult, AuditCoverage, CLIOptions } from './lib/types';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    format: 'text',
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as 'json' | 'text' | 'markdown';
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    }
  }

  return options;
}

// ============================================================================
// Audit Logic
// ============================================================================

/**
 * Get all source files in the project
 */
function getAllSourceFiles(projectRoot: string): string[] {
  const patterns = [
    'backend/src/**/*.js',
    'backend/prisma/**/*.prisma',
    'frontend/app/**/*.tsx',
    'frontend/src/**/*.tsx',
    'frontend/src/**/*.ts',
  ];

  const exclusions = [
    '**/node_modules/**',
    '**/__tests__/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/dist/**',
    '**/build/**',
  ];

  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const matches = glob.sync(pattern, {
      cwd: projectRoot,
      ignore: exclusions,
    });
    allFiles.push(...matches);
  }

  return [...new Set(allFiles)].sort();
}

/**
 * Audit the context coverage
 */
async function auditContext(projectRoot: string): Promise<AuditResult> {
  // Load hierarchy
  const hierarchyPath = path.join(projectRoot, 'ai/config/context-hierarchy.yml');

  if (!fs.existsSync(hierarchyPath)) {
    throw new Error(`Hierarchy file not found: ${hierarchyPath}`);
  }

  const hierarchy = loadHierarchy(hierarchyPath);
  const hierarchyFiles = getHierarchyFiles(projectRoot, hierarchy);

  // Get all source files
  const allFiles = getAllSourceFiles(projectRoot);

  // Categorize files
  const byTier: AuditResult['byTier'] = {
    foundation: [],
    project: [],
    scope: [],
    undocumented: [],
  };

  for (const file of allFiles) {
    const tier = hierarchyFiles.get(file);

    const coverage: AuditCoverage = {
      file,
      documented: !!tier,
      tier: tier || 'none',
    };

    if (tier) {
      byTier[tier].push(coverage);
    } else {
      byTier.undocumented.push(coverage);
    }
  }

  // Calculate stats
  const documentedFiles =
    byTier.foundation.length + byTier.project.length + byTier.scope.length;
  const totalFiles = allFiles.length;
  const coveragePercent = totalFiles > 0 ? (documentedFiles / totalFiles) * 100 : 0;

  // Generate suggestions
  const suggestions: string[] = [];

  if (byTier.undocumented.length > 0) {
    // Group by directory for better suggestions
    const byDir = new Map<string, string[]>();
    for (const item of byTier.undocumented) {
      const dir = path.dirname(item.file);
      const existing = byDir.get(dir) || [];
      existing.push(item.file);
      byDir.set(dir, existing);
    }

    for (const [dir, files] of byDir) {
      if (files.length >= 3) {
        suggestions.push(`Add pattern for ${dir}/**/* (${files.length} undocumented files)`);
      }
    }
  }

  if (coveragePercent < 80) {
    suggestions.push(`Coverage is ${coveragePercent.toFixed(1)}% - aim for 80%+`);
  }

  return {
    totalFiles,
    documentedFiles,
    coveragePercent,
    byTier,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Output Formatters
// ============================================================================

function formatText(result: AuditResult, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('  AI Context Coverage Audit');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`  Total Files:      ${result.totalFiles}`);
  lines.push(`  Documented:       ${result.documentedFiles}`);
  lines.push(`  Coverage:         ${result.coveragePercent.toFixed(1)}%`);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('  By Tier:');
  lines.push('-'.repeat(60));
  lines.push(`  Foundation:       ${result.byTier.foundation.length} files`);
  lines.push(`  Project:          ${result.byTier.project.length} files`);
  lines.push(`  Scope:            ${result.byTier.scope.length} files`);
  lines.push(`  Undocumented:     ${result.byTier.undocumented.length} files`);
  lines.push('');

  if (verbose && result.byTier.undocumented.length > 0) {
    lines.push('-'.repeat(60));
    lines.push('  Undocumented Files:');
    lines.push('-'.repeat(60));
    for (const item of result.byTier.undocumented.slice(0, 20)) {
      lines.push(`    - ${item.file}`);
    }
    if (result.byTier.undocumented.length > 20) {
      lines.push(`    ... and ${result.byTier.undocumented.length - 20} more`);
    }
    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push('-'.repeat(60));
    lines.push('  Suggestions:');
    lines.push('-'.repeat(60));
    for (const suggestion of result.suggestions) {
      lines.push(`    💡 ${suggestion}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(60));
  lines.push(`  Completed at: ${result.timestamp}`);
  lines.push('='.repeat(60));
  lines.push('');

  return lines.join('\n');
}

function formatJson(result: AuditResult): string {
  return JSON.stringify(result, null, 2);
}

function formatMarkdown(result: AuditResult): string {
  const lines: string[] = [];

  lines.push('# AI Context Coverage Audit');
  lines.push('');
  lines.push(`**Timestamp:** ${result.timestamp}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Files | ${result.totalFiles} |`);
  lines.push(`| Documented | ${result.documentedFiles} |`);
  lines.push(`| Coverage | ${result.coveragePercent.toFixed(1)}% |`);
  lines.push('');
  lines.push('## By Tier');
  lines.push('');
  lines.push(`| Tier | Count |`);
  lines.push(`|------|-------|`);
  lines.push(`| Foundation | ${result.byTier.foundation.length} |`);
  lines.push(`| Project | ${result.byTier.project.length} |`);
  lines.push(`| Scope | ${result.byTier.scope.length} |`);
  lines.push(`| Undocumented | ${result.byTier.undocumented.length} |`);
  lines.push('');

  if (result.byTier.undocumented.length > 0) {
    lines.push('## Undocumented Files');
    lines.push('');
    lines.push('<details>');
    lines.push('<summary>Click to expand</summary>');
    lines.push('');
    for (const item of result.byTier.undocumented) {
      lines.push(`- \`${item.file}\``);
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push('## Suggestions');
    lines.push('');
    for (const suggestion of result.suggestions) {
      lines.push(`- 💡 ${suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();
  const projectRoot = path.resolve(__dirname, '../..');

  if (options.verbose) {
    console.log(`Project root: ${projectRoot}`);
  }

  try {
    const result = await auditContext(projectRoot);

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
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
