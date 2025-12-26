/**
 * Type definitions for AI context validation tools
 */

// ============================================================================
// Context Hierarchy Types
// ============================================================================

export interface ContextTier {
  name: string;
  description: string;
  files: string[];
  patterns: string[];
}

export interface ContextHierarchy {
  tiers: {
    foundation: ContextTier;
    project: ContextTier;
    scope: ContextTier;
  };
  exclusions: string[];
}

// ============================================================================
// Validation Types
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  file: string;
  line?: number;
  message: string;
  rule: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  timestamp: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: ValidationSeverity;
  validate: (context: ValidationContext) => ValidationIssue[];
}

export interface ValidationContext {
  filePath: string;
  content: string;
  hierarchy: ContextHierarchy;
  projectRoot: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditCoverage {
  file: string;
  documented: boolean;
  tier: 'foundation' | 'project' | 'scope' | 'none';
  lastUpdated?: string;
  missingDocs?: string[];
}

export interface AuditResult {
  totalFiles: number;
  documentedFiles: number;
  coveragePercent: number;
  byTier: {
    foundation: AuditCoverage[];
    project: AuditCoverage[];
    scope: AuditCoverage[];
    undocumented: AuditCoverage[];
  };
  suggestions: string[];
  timestamp: string;
}

// ============================================================================
// Context Loader Types
// ============================================================================

export interface LoadedContext {
  tier: 'foundation' | 'project' | 'scope';
  files: ContextFile[];
  totalTokens: number;
  loadedAt: string;
}

export interface ContextFile {
  path: string;
  content: string;
  tokens: number;
  tier: 'foundation' | 'project' | 'scope';
}

export interface LoadOptions {
  maxTokens?: number;
  includeTiers?: ('foundation' | 'project' | 'scope')[];
  targetFile?: string;
  summarize?: boolean;
}

// ============================================================================
// Update Types
// ============================================================================

export interface UpdateSuggestion {
  file: string;
  section: string;
  currentContent: string;
  suggestedContent: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface UpdateResult {
  filesAnalyzed: number;
  suggestionsGenerated: number;
  suggestions: UpdateSuggestion[];
  timestamp: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ToolConfig {
  projectRoot: string;
  hierarchyPath: string;
  outputFormat: 'json' | 'text' | 'markdown';
  verbose: boolean;
  strict: boolean;
}

export interface CLIOptions {
  config?: string;
  output?: string;
  format?: 'json' | 'text' | 'markdown';
  verbose?: boolean;
  strict?: boolean;
  fix?: boolean;
}

// ============================================================================
// File Pattern Types
// ============================================================================

export interface FilePattern {
  pattern: string;
  tier: 'foundation' | 'project' | 'scope';
  priority: number;
}

export interface PatternMatch {
  file: string;
  pattern: string;
  tier: 'foundation' | 'project' | 'scope';
}

// ============================================================================
// Agent Types (for orchestration)
// ============================================================================

export type AgentType =
  | 'orchestrator'
  | 'backend-specialist'
  | 'frontend-specialist'
  | 'database-specialist'
  | 'api-specialist'
  | 'test-specialist'
  | 'integration-specialist';

export interface AgentContext {
  agent: AgentType;
  maxTokens: number;
  requiredFiles: string[];
  optionalFiles: string[];
  excludePatterns: string[];
}

export interface TaskAssignment {
  taskId: string;
  agent: AgentType;
  description: string;
  files: string[];
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
}

// ============================================================================
// Utility Types
// ============================================================================

export interface FileInfo {
  path: string;
  exists: boolean;
  size: number;
  lastModified: Date;
  extension: string;
}

export interface TokenCount {
  file: string;
  tokens: number;
  characters: number;
  lines: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}
