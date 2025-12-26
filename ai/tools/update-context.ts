#!/usr/bin/env ts-node
/**
 * Context Update Tool
 *
 * Suggests documentation updates based on code changes.
 *
 * Usage:
 *   npx ts-node ai/tools/update-context.ts [files...] [options]
 *
 * Options:
 *   --format     Output format: text, json, markdown
 *   --verbose    Show detailed output
 *   --output     Write suggestions to file
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { loadHierarchy, getHierarchyFiles } from './context-validator';
import type { UpdateSuggestion, UpdateResult, CLIOptions } from './lib/types';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface UpdateOptions extends CLIOptions {
  files?: string[];
}

function parseArgs(): UpdateOptions {
  const args = process.argv.slice(2);
  const options: UpdateOptions = {
    format: 'text',
    verbose: false,
    files: [],
  };

  for (const arg of args) {
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as 'json' | 'text' | 'markdown';
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (!arg.startsWith('-')) {
      options.files!.push(arg);
    }
  }

  return options;
}

// ============================================================================
// Analysis Logic
// ============================================================================

/**
 * Detect file type and suggest documentation tier
 */
function suggestTier(filePath: string): 'foundation' | 'project' | 'scope' {
  // Foundation tier files
  if (filePath.includes('prisma/schema.prisma')) return 'foundation';
  if (filePath.includes('package.json')) return 'foundation';
  if (filePath.endsWith('.env.example')) return 'foundation';

  // Project tier files
  if (filePath.includes('/routes/')) return 'project';
  if (filePath.includes('/controllers/')) return 'project';
  if (filePath.includes('/services/')) return 'project';
  if (filePath.includes('/components/')) return 'project';
  if (filePath.includes('/contexts/')) return 'project';

  // Scope tier by default
  return 'scope';
}

/**
 * Analyze a file and generate suggestions
 */
function analyzeFile(
  filePath: string,
  projectRoot: string,
  documentedFiles: Set<string>
): UpdateSuggestion[] {
  const suggestions: UpdateSuggestion[] = [];
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    return suggestions;
  }

  // Check if file is documented
  const isDocumented = documentedFiles.has(filePath);

  if (!isDocumented) {
    const tier = suggestTier(filePath);
    suggestions.push({
      file: 'ai/config/context-hierarchy.yml',
      section: `tiers.${tier}.files`,
      currentContent: '',
      suggestedContent: `- ${filePath}`,
      reason: `New file "${filePath}" should be added to ${tier} tier`,
      confidence: 'high',
    });
  }

  // Analyze content for patterns that should be documented
  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for new routes
  if (filePath.includes('/routes/')) {
    const routePattern = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const route = match[2];

      // Check if route is documented in API_STANDARDS.md
      const apiStandardsPath = path.join(projectRoot, 'ai/guides/API_STANDARDS.md');
      if (fs.existsSync(apiStandardsPath)) {
        const apiContent = fs.readFileSync(apiStandardsPath, 'utf-8');
        if (!apiContent.includes(route)) {
          suggestions.push({
            file: 'ai/guides/API_STANDARDS.md',
            section: 'API Endpoints',
            currentContent: '',
            suggestedContent: `${method} ${route}`,
            reason: `New API endpoint "${method} ${route}" should be documented`,
            confidence: 'medium',
          });
        }
      }
    }
  }

  // Check for new models in Prisma schema
  if (filePath.includes('schema.prisma')) {
    const modelPattern = /model\s+(\w+)\s*\{/g;
    let match;
    while ((match = modelPattern.exec(content)) !== null) {
      const modelName = match[1];

      // Check if model is documented in CLAUDE.md
      const claudePath = path.join(projectRoot, 'ai/guides/CLAUDE.md');
      if (fs.existsSync(claudePath)) {
        const claudeContent = fs.readFileSync(claudePath, 'utf-8');
        if (!claudeContent.includes(modelName)) {
          suggestions.push({
            file: 'ai/guides/CLAUDE.md',
            section: 'Database Models',
            currentContent: '',
            suggestedContent: `- ${modelName}`,
            reason: `New model "${modelName}" should be documented in CLAUDE.md`,
            confidence: 'high',
          });
        }
      }
    }
  }

  // Check for socket events
  if (filePath.includes('socket') || content.includes('socket.emit') || content.includes('io.emit')) {
    const emitPattern = /(?:socket|io)\.(?:emit|to\([^)]+\)\.emit)\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = emitPattern.exec(content)) !== null) {
      const eventName = match[1];

      // Check if event is documented
      const integrationPath = path.join(projectRoot, 'ai/orchestration/integration-validation.md');
      if (fs.existsSync(integrationPath)) {
        const integrationContent = fs.readFileSync(integrationPath, 'utf-8');
        if (!integrationContent.includes(eventName)) {
          suggestions.push({
            file: 'ai/orchestration/integration-validation.md',
            section: 'Socket Event Contracts',
            currentContent: '',
            suggestedContent: `// ${eventName} event`,
            reason: `Socket event "${eventName}" should be documented`,
            confidence: 'medium',
          });
        }
      }
    }
  }

  return suggestions;
}

/**
 * Find recently modified files
 */
function getRecentlyModifiedFiles(projectRoot: string, days: number = 7): string[] {
  const patterns = [
    'backend/src/**/*.js',
    'backend/prisma/**/*.prisma',
    'frontend/app/**/*.tsx',
    'frontend/src/**/*.tsx',
    'frontend/src/**/*.ts',
  ];

  const exclusions = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
  ];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentFiles: string[] = [];

  for (const pattern of patterns) {
    const matches = glob.sync(pattern, {
      cwd: projectRoot,
      ignore: exclusions,
    });

    for (const file of matches) {
      const fullPath = path.join(projectRoot, file);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.mtime > cutoffDate) {
          recentFiles.push(file);
        }
      } catch {
        // Ignore stat errors
      }
    }
  }

  return recentFiles;
}

/**
 * Run the update analysis
 */
async function analyzeUpdates(
  projectRoot: string,
  options: UpdateOptions
): Promise<UpdateResult> {
  // Load hierarchy
  const hierarchyPath = path.join(projectRoot, 'ai/config/context-hierarchy.yml');
  const hierarchy = loadHierarchy(hierarchyPath);
  const hierarchyFiles = getHierarchyFiles(projectRoot, hierarchy);
  const documentedFiles = new Set(hierarchyFiles.keys());

  // Get files to analyze
  let filesToAnalyze: string[];
  if (options.files && options.files.length > 0) {
    filesToAnalyze = options.files;
  } else {
    filesToAnalyze = getRecentlyModifiedFiles(projectRoot);
  }

  if (options.verbose) {
    console.log(`Analyzing ${filesToAnalyze.length} files...`);
  }

  // Analyze each file
  const allSuggestions: UpdateSuggestion[] = [];

  for (const file of filesToAnalyze) {
    const suggestions = analyzeFile(file, projectRoot, documentedFiles);
    allSuggestions.push(...suggestions);
  }

  // Deduplicate suggestions
  const uniqueSuggestions = allSuggestions.filter(
    (suggestion, index, self) =>
      index ===
      self.findIndex(
        (s) =>
          s.file === suggestion.file &&
          s.section === suggestion.section &&
          s.suggestedContent === suggestion.suggestedContent
      )
  );

  return {
    filesAnalyzed: filesToAnalyze.length,
    suggestionsGenerated: uniqueSuggestions.length,
    suggestions: uniqueSuggestions,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Output Formatters
// ============================================================================

function formatText(result: UpdateResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('  Context Update Suggestions');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`  Files Analyzed:        ${result.filesAnalyzed}`);
  lines.push(`  Suggestions Generated: ${result.suggestionsGenerated}`);
  lines.push('');

  if (result.suggestions.length === 0) {
    lines.push('  ✅ No updates needed!');
  } else {
    lines.push('-'.repeat(60));
    lines.push('  Suggestions:');
    lines.push('-'.repeat(60));

    for (const suggestion of result.suggestions) {
      const confidenceIcon =
        suggestion.confidence === 'high' ? '🟢' :
        suggestion.confidence === 'medium' ? '🟡' : '🔴';
      lines.push('');
      lines.push(`  ${confidenceIcon} ${suggestion.file}`);
      lines.push(`     Section: ${suggestion.section}`);
      lines.push(`     Reason: ${suggestion.reason}`);
      lines.push(`     Add: ${suggestion.suggestedContent}`);
    }
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push(`  Completed at: ${result.timestamp}`);
  lines.push('='.repeat(60));
  lines.push('');

  return lines.join('\n');
}

function formatJson(result: UpdateResult): string {
  return JSON.stringify(result, null, 2);
}

function formatMarkdown(result: UpdateResult): string {
  const lines: string[] = [];

  lines.push('# Context Update Suggestions');
  lines.push('');
  lines.push(`**Timestamp:** ${result.timestamp}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Files Analyzed: ${result.filesAnalyzed}`);
  lines.push(`- Suggestions: ${result.suggestionsGenerated}`);
  lines.push('');

  if (result.suggestions.length > 0) {
    lines.push('## Suggestions');
    lines.push('');

    const byFile = new Map<string, UpdateSuggestion[]>();
    for (const suggestion of result.suggestions) {
      const existing = byFile.get(suggestion.file) || [];
      existing.push(suggestion);
      byFile.set(suggestion.file, existing);
    }

    for (const [file, suggestions] of byFile) {
      lines.push(`### ${file}`);
      lines.push('');
      for (const suggestion of suggestions) {
        const badge =
          suggestion.confidence === 'high' ? '🟢 High' :
          suggestion.confidence === 'medium' ? '🟡 Medium' : '🔴 Low';
        lines.push(`- **${suggestion.section}** (${badge})`);
        lines.push(`  - ${suggestion.reason}`);
        lines.push(`  - Add: \`${suggestion.suggestedContent}\``);
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
  const projectRoot = path.resolve(__dirname, '../..');

  if (options.verbose) {
    console.log(`Project root: ${projectRoot}`);
    if (options.files && options.files.length > 0) {
      console.log(`Target files: ${options.files.join(', ')}`);
    } else {
      console.log('Analyzing recently modified files...');
    }
  }

  try {
    const result = await analyzeUpdates(projectRoot, options);

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
        output = formatText(result);
    }

    // Write output
    if (options.output) {
      fs.writeFileSync(options.output, output);
      console.log(`Suggestions written to: ${options.output}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
