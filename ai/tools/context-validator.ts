/**
 * Core Context Validation Logic
 *
 * Provides validation functions for AI context documentation.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { glob } from 'glob';
import type {
  ContextHierarchy,
  ValidationResult,
  ValidationIssue,
  ValidationRule,
  ValidationContext,
} from './lib/types';

// ============================================================================
// Hierarchy Loading
// ============================================================================

/**
 * Load and parse the context hierarchy YAML file
 */
export function loadHierarchy(filePath: string): ContextHierarchy {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.parse(content);

  // Helper to extract files and patterns from sources array
  const extractFromSources = (sources: any[] = []): { files: string[]; patterns: string[] } => {
    const files: string[] = [];
    const patterns: string[] = [];

    for (const source of sources) {
      if (source.path) {
        files.push(source.path);
      }
      if (source.pattern) {
        patterns.push(source.pattern);
      }
    }

    return { files, patterns };
  };

  // Support both old format (tiers.foundation.files) and new format (context.foundation.sources)
  const context = parsed.context || parsed.tiers || {};
  const foundationData = extractFromSources(context.foundation?.sources);
  const projectData = extractFromSources(context.project?.sources);
  const scopeData = extractFromSources(context.scope?.sources);

  // Transform YAML structure to ContextHierarchy
  const hierarchy: ContextHierarchy = {
    tiers: {
      foundation: {
        name: 'Foundation',
        description: context.foundation?.description || 'Core context always included',
        files: foundationData.files.length > 0 ? foundationData.files : (parsed.tiers?.foundation?.files || []),
        patterns: foundationData.patterns.length > 0 ? foundationData.patterns : (parsed.tiers?.foundation?.patterns || []),
      },
      project: {
        name: 'Project',
        description: context.project?.description || 'Project-specific context',
        files: projectData.files.length > 0 ? projectData.files : (parsed.tiers?.project?.files || []),
        patterns: projectData.patterns.length > 0 ? projectData.patterns : (parsed.tiers?.project?.patterns || []),
      },
      scope: {
        name: 'Scope',
        description: context.scope?.description || 'Task-specific context',
        files: scopeData.files.length > 0 ? scopeData.files : (parsed.tiers?.scope?.files || []),
        patterns: scopeData.patterns.length > 0 ? scopeData.patterns : (parsed.tiers?.scope?.patterns || []),
      },
    },
    exclusions: parsed.rules?.exclude || parsed.exclusions || [],
  };

  return hierarchy;
}

// ============================================================================
// Validation Rules
// ============================================================================

const validationRules: ValidationRule[] = [
  {
    id: 'hierarchy-valid',
    name: 'Valid Hierarchy Structure',
    description: 'Ensures hierarchy YAML has required structure',
    severity: 'error',
    validate: (ctx: ValidationContext): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];
      const { hierarchy, filePath } = ctx;

      if (!hierarchy.tiers) {
        issues.push({
          severity: 'error',
          file: filePath,
          message: 'Missing "tiers" section in hierarchy',
          rule: 'hierarchy-valid',
        });
      }

      const requiredTiers = ['foundation', 'project', 'scope'];
      for (const tier of requiredTiers) {
        if (!hierarchy.tiers[tier as keyof typeof hierarchy.tiers]) {
          issues.push({
            severity: 'error',
            file: filePath,
            message: `Missing required tier: ${tier}`,
            rule: 'hierarchy-valid',
          });
        }
      }

      return issues;
    },
  },
  {
    id: 'files-exist',
    name: 'Referenced Files Exist',
    description: 'Ensures all referenced files exist',
    severity: 'error',
    validate: (ctx: ValidationContext): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];
      const { hierarchy, projectRoot } = ctx;

      const allFiles = [
        ...hierarchy.tiers.foundation.files,
        ...hierarchy.tiers.project.files,
        ...hierarchy.tiers.scope.files,
      ];

      for (const file of allFiles) {
        // Skip patterns (contain * or **)
        if (file.includes('*')) continue;

        const fullPath = path.join(projectRoot, file);
        if (!fs.existsSync(fullPath)) {
          issues.push({
            severity: 'error',
            file: file,
            message: `Referenced file does not exist: ${file}`,
            rule: 'files-exist',
            suggestion: `Remove from hierarchy or create the file`,
          });
        }
      }

      return issues;
    },
  },
  {
    id: 'patterns-match',
    name: 'Patterns Match Files',
    description: 'Ensures file patterns match at least one file',
    severity: 'warning',
    validate: (ctx: ValidationContext): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];
      const { hierarchy, projectRoot } = ctx;

      const allPatterns = [
        ...hierarchy.tiers.foundation.patterns,
        ...hierarchy.tiers.project.patterns,
        ...hierarchy.tiers.scope.patterns,
      ];

      for (const pattern of allPatterns) {
        try {
          const matches = glob.sync(pattern, {
            cwd: projectRoot,
            ignore: hierarchy.exclusions,
          });

          if (matches.length === 0) {
            issues.push({
              severity: 'warning',
              file: 'context-hierarchy.yml',
              message: `Pattern matches no files: ${pattern}`,
              rule: 'patterns-match',
              suggestion: `Update pattern or remove if no longer needed`,
            });
          }
        } catch (error) {
          issues.push({
            severity: 'error',
            file: 'context-hierarchy.yml',
            message: `Invalid pattern: ${pattern}`,
            rule: 'patterns-match',
          });
        }
      }

      return issues;
    },
  },
  {
    id: 'guides-exist',
    name: 'Required Guides Exist',
    description: 'Ensures core guide files exist',
    severity: 'error',
    validate: (ctx: ValidationContext): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];
      const { projectRoot } = ctx;

      const requiredGuides = [
        'ai/guides/CLAUDE.md',
        'ai/guides/ARCHITECTURE.md',
        'ai/guides/CONVENTIONS.md',
      ];

      for (const guide of requiredGuides) {
        const fullPath = path.join(projectRoot, guide);
        if (!fs.existsSync(fullPath)) {
          issues.push({
            severity: 'error',
            file: guide,
            message: `Required guide missing: ${guide}`,
            rule: 'guides-exist',
            suggestion: `Create the guide file`,
          });
        }
      }

      return issues;
    },
  },
  {
    id: 'no-duplicate-entries',
    name: 'No Duplicate Entries',
    description: 'Ensures no duplicate file entries across tiers',
    severity: 'warning',
    validate: (ctx: ValidationContext): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];
      const { hierarchy } = ctx;

      const allFiles = [
        ...hierarchy.tiers.foundation.files.map((f) => ({ file: f, tier: 'foundation' })),
        ...hierarchy.tiers.project.files.map((f) => ({ file: f, tier: 'project' })),
        ...hierarchy.tiers.scope.files.map((f) => ({ file: f, tier: 'scope' })),
      ];

      const seen = new Map<string, string>();
      for (const entry of allFiles) {
        if (seen.has(entry.file)) {
          issues.push({
            severity: 'warning',
            file: entry.file,
            message: `Duplicate entry: appears in both "${seen.get(entry.file)}" and "${entry.tier}" tiers`,
            rule: 'no-duplicate-entries',
            suggestion: `Keep file in only one tier (typically the highest priority tier)`,
          });
        } else {
          seen.set(entry.file, entry.tier);
        }
      }

      return issues;
    },
  },
  {
    id: 'schema-documented',
    name: 'Schema Documentation',
    description: 'Ensures Prisma schema is in foundation tier',
    severity: 'warning',
    validate: (ctx: ValidationContext): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];
      const { hierarchy, projectRoot } = ctx;

      const schemaPath = 'backend/prisma/schema.prisma';
      const fullPath = path.join(projectRoot, schemaPath);

      if (fs.existsSync(fullPath)) {
        const foundationFiles = hierarchy.tiers.foundation.files;
        const foundationPatterns = hierarchy.tiers.foundation.patterns;

        const isInFoundation =
          foundationFiles.includes(schemaPath) ||
          foundationPatterns.some((p) => schemaPath.match(p.replace('*', '.*')));

        if (!isInFoundation) {
          issues.push({
            severity: 'warning',
            file: schemaPath,
            message: 'Prisma schema should be in foundation tier',
            rule: 'schema-documented',
            suggestion: 'Add to foundation tier files',
          });
        }
      }

      return issues;
    },
  },
];

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate the context documentation
 */
export async function validateContext(
  projectRoot: string,
  hierarchy: ContextHierarchy
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  // Create validation context
  const ctx: ValidationContext = {
    filePath: 'ai/config/context-hierarchy.yml',
    content: '', // Not needed for current rules
    hierarchy,
    projectRoot,
  };

  // Run all validation rules
  for (const rule of validationRules) {
    try {
      const ruleIssues = rule.validate(ctx);
      issues.push(...ruleIssues);
    } catch (error) {
      issues.push({
        severity: 'error',
        file: 'validation',
        message: `Rule "${rule.id}" failed: ${error}`,
        rule: rule.id,
      });
    }
  }

  // Calculate summary
  const summary = {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    infos: issues.filter((i) => i.severity === 'info').length,
  };

  return {
    valid: summary.errors === 0,
    issues,
    summary,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a file matches any exclusion pattern
 */
export function isExcluded(filePath: string, exclusions: string[]): boolean {
  for (const pattern of exclusions) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    if (regex.test(filePath)) {
      return true;
    }
  }
  return false;
}

/**
 * Get all files matching the hierarchy configuration
 */
export function getHierarchyFiles(
  projectRoot: string,
  hierarchy: ContextHierarchy
): Map<string, 'foundation' | 'project' | 'scope'> {
  const fileMap = new Map<string, 'foundation' | 'project' | 'scope'>();

  const tiers: Array<'foundation' | 'project' | 'scope'> = ['foundation', 'project', 'scope'];

  for (const tier of tiers) {
    const tierConfig = hierarchy.tiers[tier];

    // Add explicit files
    for (const file of tierConfig.files) {
      if (!file.includes('*') && !fileMap.has(file)) {
        fileMap.set(file, tier);
      }
    }

    // Add pattern matches
    for (const pattern of tierConfig.patterns) {
      try {
        const matches = glob.sync(pattern, {
          cwd: projectRoot,
          ignore: hierarchy.exclusions,
        });

        for (const match of matches) {
          if (!fileMap.has(match)) {
            fileMap.set(match, tier);
          }
        }
      } catch {
        // Ignore invalid patterns here (caught by validation)
      }
    }
  }

  return fileMap;
}
