# AI Context Validation Tools

TypeScript tools for validating and managing AI context documentation.

## Overview

These tools ensure the AI context documentation stays accurate and comprehensive as the codebase evolves.

## Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| `validate-context.ts` | Pre-commit validation | `npx ts-node ai/tools/validate-context.ts` |
| `audit-context.ts` | Coverage auditing | `npx ts-node ai/tools/audit-context.ts` |
| `context-loader.ts` | Load context for files | `npx ts-node ai/tools/context-loader.ts <file>` |
| `update-context.ts` | Suggest doc updates | `npx ts-node ai/tools/update-context.ts` |

## Installation

```bash
# Install dependencies (from project root)
npm install --save-dev typescript ts-node @types/node glob yaml

# Or add to package.json scripts
{
  "scripts": {
    "validate:context": "ts-node ai/tools/validate-context.ts",
    "audit:context": "ts-node ai/tools/audit-context.ts",
    "update:context": "ts-node ai/tools/update-context.ts"
  }
}
```

## Tool Details

### validate-context.ts

Validates that context documentation is accurate and follows conventions.

```bash
# Run validation
npx ts-node ai/tools/validate-context.ts

# With options
npx ts-node ai/tools/validate-context.ts --strict --format=json
```

**Checks performed:**
- Context hierarchy file is valid YAML
- All referenced files exist
- No orphaned documentation
- File patterns match actual files
- Cross-references are valid

### audit-context.ts

Audits documentation coverage across the codebase.

```bash
# Run audit
npx ts-node ai/tools/audit-context.ts

# Generate report
npx ts-node ai/tools/audit-context.ts --output=report.md
```

**Reports:**
- Files documented vs undocumented
- Coverage by tier (foundation, project, scope)
- Missing documentation suggestions
- Stale documentation warnings

### context-loader.ts

Loads relevant context for a given file or task.

```bash
# Load context for a file
npx ts-node ai/tools/context-loader.ts backend/src/services/auctionService.js

# Load with token limit
npx ts-node ai/tools/context-loader.ts --max-tokens=16000 backend/src/routes/auctions.js
```

**Features:**
- Tier-based context loading
- Token counting and limiting
- Dependency detection
- Related file discovery

### update-context.ts

Suggests documentation updates based on code changes.

```bash
# Analyze changes and suggest updates
npx ts-node ai/tools/update-context.ts

# For specific files
npx ts-node ai/tools/update-context.ts backend/src/services/negotiationService.js
```

**Suggests:**
- New file documentation
- Updated patterns
- Removed file cleanup
- Stale content updates

## Configuration

Tools read from `ai/config/context-hierarchy.yml` by default.

```yaml
# Custom config location
npx ts-node ai/tools/validate-context.ts --config=custom-config.yml
```

## Output Formats

All tools support multiple output formats:

```bash
# Text output (default)
npx ts-node ai/tools/validate-context.ts --format=text

# JSON output (for CI/CD)
npx ts-node ai/tools/validate-context.ts --format=json

# Markdown output (for reports)
npx ts-node ai/tools/validate-context.ts --format=markdown
```

## Git Hooks Integration

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate context on commit
npx ts-node ai/tools/validate-context.ts --strict

# Exit if validation fails
if [ $? -ne 0 ]; then
  echo "Context validation failed. Please fix issues before committing."
  exit 1
fi
```

## CI/CD Integration

```yaml
# .github/workflows/validate.yml
name: Validate Context

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Validate context
        run: npx ts-node ai/tools/validate-context.ts --strict --format=json

      - name: Audit coverage
        run: npx ts-node ai/tools/audit-context.ts --format=markdown >> $GITHUB_STEP_SUMMARY
```

## Type Definitions

See `lib/types.ts` for all type definitions used by these tools.

## Development

```bash
# Run with verbose output
npx ts-node ai/tools/validate-context.ts --verbose

# Debug mode
DEBUG=context:* npx ts-node ai/tools/validate-context.ts
```

---

**Last Updated**: 2025-12-26
