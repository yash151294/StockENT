#!/usr/bin/env ts-node
/**
 * Context Loader Tool
 *
 * Loads relevant context for a given file or task.
 *
 * Usage:
 *   npx ts-node ai/tools/context-loader.ts <file> [options]
 *
 * Options:
 *   --max-tokens    Maximum tokens to load (default: 32000)
 *   --tiers         Tiers to include: foundation,project,scope
 *   --format        Output format: text, json
 *   --verbose       Show detailed output
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadHierarchy, getHierarchyFiles } from './context-validator';
import type { LoadedContext, ContextFile, LoadOptions } from './lib/types';

// ============================================================================
// Constants
// ============================================================================

// Approximate tokens per character (rough estimate)
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 32000;

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CLIOptions extends LoadOptions {
  targetFile?: string;
  format?: 'text' | 'json';
  verbose?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    maxTokens: DEFAULT_MAX_TOKENS,
    includeTiers: ['foundation', 'project', 'scope'],
    format: 'text',
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--max-tokens=')) {
      options.maxTokens = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--tiers=')) {
      options.includeTiers = arg.split('=')[1].split(',') as ('foundation' | 'project' | 'scope')[];
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as 'text' | 'json';
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (!arg.startsWith('-')) {
      options.targetFile = arg;
    }
  }

  return options;
}

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Estimate token count from content
 */
function estimateTokens(content: string): number {
  return Math.ceil(content.length / CHARS_PER_TOKEN);
}

// ============================================================================
// Context Loading Logic
// ============================================================================

/**
 * Get related files for a target file
 */
function getRelatedFiles(targetFile: string, projectRoot: string): string[] {
  const related: string[] = [];
  const ext = path.extname(targetFile);
  const basename = path.basename(targetFile, ext);
  const dirname = path.dirname(targetFile);

  // Same directory files
  if (fs.existsSync(path.join(projectRoot, dirname))) {
    const dirFiles = fs.readdirSync(path.join(projectRoot, dirname));
    for (const file of dirFiles) {
      const relPath = path.join(dirname, file);
      if (relPath !== targetFile) {
        related.push(relPath);
      }
    }
  }

  // Test file
  const testPatterns = [
    `${dirname}/__tests__/${basename}.test${ext}`,
    `${dirname}/__tests__/${basename}.spec${ext}`,
    `${dirname}/${basename}.test${ext}`,
    `${dirname}/${basename}.spec${ext}`,
  ];

  for (const pattern of testPatterns) {
    if (fs.existsSync(path.join(projectRoot, pattern))) {
      related.push(pattern);
    }
  }

  return related;
}

/**
 * Load context for a target file
 */
async function loadContext(
  projectRoot: string,
  options: CLIOptions
): Promise<LoadedContext> {
  // Load hierarchy
  const hierarchyPath = path.join(projectRoot, 'ai/config/context-hierarchy.yml');
  const hierarchy = loadHierarchy(hierarchyPath);
  const hierarchyFiles = getHierarchyFiles(projectRoot, hierarchy);

  // Collect files by tier
  const filesByTier: Record<'foundation' | 'project' | 'scope', string[]> = {
    foundation: [],
    project: [],
    scope: [],
  };

  for (const [file, tier] of hierarchyFiles) {
    if (options.includeTiers?.includes(tier)) {
      filesByTier[tier].push(file);
    }
  }

  // If target file specified, add related files to scope
  if (options.targetFile) {
    const related = getRelatedFiles(options.targetFile, projectRoot);
    for (const file of related) {
      if (!filesByTier.scope.includes(file)) {
        filesByTier.scope.push(file);
      }
    }
  }

  // Load files with token budget
  const loadedFiles: ContextFile[] = [];
  let totalTokens = 0;
  const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;

  // Priority order: foundation > project > scope
  const tierOrder: ('foundation' | 'project' | 'scope')[] = ['foundation', 'project', 'scope'];

  for (const tier of tierOrder) {
    if (!options.includeTiers?.includes(tier)) continue;

    for (const file of filesByTier[tier]) {
      const fullPath = path.join(projectRoot, file);

      if (!fs.existsSync(fullPath)) continue;
      if (!fs.statSync(fullPath).isFile()) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const tokens = estimateTokens(content);

        // Check if we have budget
        if (totalTokens + tokens > maxTokens) {
          if (options.verbose) {
            console.log(`⚠️ Skipping ${file} (would exceed token limit)`);
          }
          continue;
        }

        loadedFiles.push({
          path: file,
          content,
          tokens,
          tier,
        });

        totalTokens += tokens;
      } catch (error) {
        if (options.verbose) {
          console.log(`⚠️ Could not read ${file}: ${error}`);
        }
      }
    }
  }

  return {
    tier: 'project', // Composite of all loaded tiers
    files: loadedFiles,
    totalTokens,
    loadedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Output Formatters
// ============================================================================

function formatText(context: LoadedContext, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('  Loaded Context');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`  Files Loaded:     ${context.files.length}`);
  lines.push(`  Total Tokens:     ${context.totalTokens.toLocaleString()}`);
  lines.push(`  Loaded At:        ${context.loadedAt}`);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('  Files:');
  lines.push('-'.repeat(60));

  const byTier = {
    foundation: context.files.filter((f) => f.tier === 'foundation'),
    project: context.files.filter((f) => f.tier === 'project'),
    scope: context.files.filter((f) => f.tier === 'scope'),
  };

  for (const [tier, files] of Object.entries(byTier)) {
    if (files.length === 0) continue;
    lines.push('');
    lines.push(`  ${tier.toUpperCase()} (${files.length} files, ${files.reduce((sum, f) => sum + f.tokens, 0)} tokens)`);
    for (const file of files) {
      lines.push(`    - ${file.path} (${file.tokens} tokens)`);
    }
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');

  if (verbose) {
    lines.push('');
    lines.push('File Contents:');
    lines.push('='.repeat(60));
    for (const file of context.files) {
      lines.push('');
      lines.push(`--- ${file.path} ---`);
      lines.push(file.content);
    }
  }

  return lines.join('\n');
}

function formatJson(context: LoadedContext): string {
  // Don't include full content in JSON output for readability
  const summary = {
    ...context,
    files: context.files.map((f) => ({
      path: f.path,
      tier: f.tier,
      tokens: f.tokens,
    })),
  };
  return JSON.stringify(summary, null, 2);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();
  const projectRoot = path.resolve(__dirname, '../..');

  if (options.verbose) {
    console.log(`Project root: ${projectRoot}`);
    console.log(`Target file: ${options.targetFile || '(none)'}`);
    console.log(`Max tokens: ${options.maxTokens}`);
    console.log(`Tiers: ${options.includeTiers?.join(', ')}`);
  }

  try {
    const context = await loadContext(projectRoot, options);

    // Format output
    let output: string;
    switch (options.format) {
      case 'json':
        output = formatJson(context);
        break;
      default:
        output = formatText(context, options.verbose || false);
    }

    console.log(output);
  } catch (error) {
    console.error('❌ Failed to load context:', error);
    process.exit(1);
  }
}

main().catch(console.error);
