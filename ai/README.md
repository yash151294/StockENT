# StockENT AI Development Infrastructure

**@context_tier**: foundation

This directory contains context engineering and agent orchestration for AI-assisted development of StockENT.

## Quick Start

### For AI Assistants
1. Start with `guides/CLAUDE.md` for complete project context
2. Reference `guides/ARCHITECTURE.md` for system design
3. Check `guides/CONVENTIONS.md` before writing code

### For Developers
```bash
# Validate context documentation
npm run context:validate

# Audit context coverage
npm run context:audit

# Load context for a specific file
npm run context:load <file-path>

# Update documentation after code changes
npm run context:update
```

## Directory Structure

```
ai/
├── README.md                    # This file
├── config/
│   └── context-hierarchy.yml    # 3-tier context loading configuration
├── guides/
│   ├── CLAUDE.md               # Complete project guide (primary)
│   ├── ARCHITECTURE.md         # System design patterns
│   ├── CONVENTIONS.md          # Coding standards
│   ├── API_STANDARDS.md        # REST API guidelines
│   ├── SECURITY.md             # Security requirements
│   └── ANTI_PATTERNS.md        # Common mistakes to avoid
├── orchestration/
│   ├── README.md               # Orchestration overview
│   ├── agents/
│   │   ├── orchestrator.md     # Pure coordination agent
│   │   ├── backend-specialist.md
│   │   ├── frontend-specialist.md
│   │   ├── database-specialist.md
│   │   ├── api-specialist.md
│   │   ├── test-specialist.md
│   │   └── integration-specialist.md
│   ├── context-management.md   # Wave-based execution
│   └── integration-validation.md
└── tools/
    ├── README.md               # Tools documentation
    ├── validate-context.ts     # Pre-commit validation
    ├── context-validator.ts    # Core validation logic
    ├── audit-context.ts        # Coverage auditing
    ├── context-loader.ts       # Context loading utility
    ├── update-context.ts       # AI-assisted doc updates
    └── lib/
        └── types.ts            # TypeScript definitions
```

## Context Engineering

### Three-Tier Hierarchy

1. **Tier 1 (Foundation)** - Always included:
   - Core guides (CLAUDE.md, ARCHITECTURE.md, etc.)
   - Prisma schema
   - Package.json files

2. **Tier 2 (Project)** - Auto-detected based on file context:
   - Related controllers, services, routes
   - Relevant React components
   - Database models

3. **Tier 3 (Scope)** - Dynamic based on current work:
   - Related test files
   - Immediate dependencies
   - Import graph (2 levels deep)

### Quality Gates

Pre-commit validation ensures:
- Required foundation files exist
- Documentation freshness (max 90 days)
- Minimum content quality (500+ chars)
- Code examples present
- No conflicting guidance
- **Minimum score: 70/100**

## Agent Orchestration

### 4-Layer Architecture

1. **Orchestrator** - Pure coordination (never writes code)
2. **Context Management** - Wave-based execution, token budgets
3. **Specialists** - Domain-specific implementation agents
4. **Integration Validation** - Cross-component verification

### Specialist Agents

| Agent | Domain | Stack |
|-------|--------|-------|
| backend-specialist | Express.js, services, controllers | Node.js, Express, Prisma |
| frontend-specialist | Next.js, React, components | Next.js 14, React 18, TypeScript |
| database-specialist | Prisma, migrations, queries | PostgreSQL, Prisma ORM |
| api-specialist | Routes, validation, DTOs | Express routes, Joi |
| test-specialist | Jest, testing strategies | Jest, Supertest, RTL |
| integration-specialist | Socket.io, external APIs | Socket.io, cross-cutting |

### Wave-Based Execution

```
Wave 1 (Foundation - Parallel):
  - api-specialist: DTOs, route definitions
  - database-specialist: Prisma schema, migrations

Wave 2 (Implementation - Parallel):
  - backend-specialist: Services, controllers
  - frontend-specialist: Components, hooks

Wave 3 (Validation - Sequential):
  - test-specialist: Integration tests
  - integration-specialist: End-to-end validation
```

## Adding npm Scripts

Add to `package.json` in project root:

```json
{
  "scripts": {
    "context:validate": "npx tsx ai/tools/validate-context.ts",
    "context:audit": "npx tsx ai/tools/audit-context.ts",
    "context:load": "npx tsx ai/tools/context-loader.ts",
    "context:update": "npx tsx ai/tools/update-context.ts"
  }
}
```

## Related Documentation

- `guides/CLAUDE.md` - Start here for full project context
- `guides/ARCHITECTURE.md` - System design and patterns
- `orchestration/README.md` - Agent coordination details
- `tools/README.md` - Validation tool usage

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
