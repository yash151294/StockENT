# StockENT Agent Orchestration

**@context_tier**: foundation

This directory contains the multi-agent orchestration system for AI-assisted development of StockENT.

## Overview

The orchestration system uses a **4-layer architecture** to coordinate AI agents for complex development tasks:

1. **Orchestrator** - Pure coordination (never writes code)
2. **Context Management** - Wave-based execution, token budgets
3. **Specialists** - Domain-specific implementation agents
4. **Integration Validation** - Cross-component verification

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                            │
│  • Analyzes task complexity                                  │
│  • Decomposes into subtasks                                  │
│  • Assigns to specialists                                    │
│  • Coordinates wave execution                                │
│  • NEVER writes code directly                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  CONTEXT MANAGEMENT                          │
│  • Wave-based execution                                      │
│  • Token budget tracking                                     │
│  • Minimal context transfer                                  │
│  • Handoff protocols                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     SPECIALISTS                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Backend │ │Frontend │ │Database │ │   API   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────────────────────────────┐           │
│  │  Test   │ │       Integration              │           │
│  └─────────┘ └─────────────────────────────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│               INTEGRATION VALIDATION                         │
│  • Cross-component contracts                                 │
│  • Type matching                                            │
│  • End-to-end flow verification                             │
└─────────────────────────────────────────────────────────────┘
```

## Specialist Agents

| Agent | Domain | Stack | File |
|-------|--------|-------|------|
| **Orchestrator** | Coordination | N/A | `agents/orchestrator.md` |
| **Backend** | Express.js, services, controllers | Node.js, Express, Prisma | `agents/backend-specialist.md` |
| **Frontend** | Next.js, React, components | Next.js 14, React 18, TypeScript | `agents/frontend-specialist.md` |
| **Database** | Prisma, migrations, queries | PostgreSQL, Prisma ORM | `agents/database-specialist.md` |
| **API** | Routes, validation, DTOs | Express routes, Joi | `agents/api-specialist.md` |
| **Test** | Jest, testing strategies | Jest, Supertest, RTL | `agents/test-specialist.md` |
| **Integration** | Socket.io, external APIs | Cross-cutting concerns | `agents/integration-specialist.md` |

## Wave-Based Execution

Tasks are organized into parallel waves with dependencies:

```
Wave 1 (Foundation - Parallel):
├── api-specialist: DTOs, route definitions
└── database-specialist: Prisma schema changes

Wave 2 (Implementation - Parallel, depends on Wave 1):
├── backend-specialist: Services, controllers
├── frontend-specialist: Components, hooks
└── integration-specialist: Socket.io setup

Wave 3 (Validation - Sequential, depends on Wave 2):
├── test-specialist: Integration tests
└── integration-specialist: End-to-end validation
```

### Benefits

- **60-70% token reduction** vs single-agent approach
- **Zero architectural drift** through orchestrator constraints
- **Parallel execution** where dependencies allow
- **Clear boundaries** between specialists

## Context Transfer Protocol

When one agent hands off to another:

```
Handoff Package:
├── Interfaces: Types, contracts, schemas
├── Artifacts: Created files, modified files
├── Implementation Notes: Critical decisions, constraints
├── Test Requirements: What needs verification
└── Context Budget: Remaining tokens for next agent
```

### Example Handoff

```json
{
  "from_agent": "backend-specialist",
  "to_agent": "frontend-specialist",
  "artifacts": {
    "interfaces": {
      "dtos": ["ProductDTO", "AuctionDTO"],
      "endpoints": {
        "GET /api/products": "Returns ProductDTO[]",
        "POST /api/products": "Accepts CreateProductInput"
      }
    },
    "implementation_notes": {
      "critical": "Prices are locked when added to cart",
      "optimization": "Use React Query for caching"
    },
    "test_requirements": [
      "Verify product list renders correctly",
      "Verify add to cart updates UI"
    ]
  },
  "next_agent_context": {
    "focus": "Implement product listing page",
    "constraints": "Follow existing component patterns",
    "available_context_budget": 8500
  }
}
```

## Usage

### For Simple Tasks

Direct implementation without full orchestration:

```
User: "Fix the typo in ProductCard.tsx"
→ Skip orchestration
→ Direct edit
```

### For Complex Tasks

Full orchestration with wave execution:

```
User: "Add price negotiation feature"

Orchestrator Analysis:
├── Multi-file: YES
├── Domains: database, backend, frontend, real-time
├── Parallelization: Waves 1-3

Wave Execution:
├── Wave 1: Schema + DTOs
├── Wave 2: Backend + Frontend (parallel)
└── Wave 3: Testing + Validation
```

## Files

- `agents/orchestrator.md` - Orchestrator coordination patterns
- `agents/backend-specialist.md` - Express.js/Node.js patterns
- `agents/frontend-specialist.md` - Next.js/React patterns
- `agents/database-specialist.md` - Prisma patterns
- `agents/api-specialist.md` - API design patterns
- `agents/test-specialist.md` - Testing patterns
- `agents/integration-specialist.md` - Cross-cutting patterns
- `context-management.md` - Wave execution details
- `integration-validation.md` - Validation checklists

## Related Documentation

- `../guides/CLAUDE.md` - Complete project guide
- `../guides/ARCHITECTURE.md` - System design patterns
- `../config/context-hierarchy.yml` - Context loading

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
