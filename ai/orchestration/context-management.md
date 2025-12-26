# Context Management

## Wave-Based Execution

Context management ensures efficient parallel execution while respecting dependencies.

## Wave Architecture

```
Wave 1 (Foundation)
├── Orchestrator analyzes task
├── Loads Tier 1 context (schema, package.json)
└── Decomposes into subtasks

Wave 2 (Parallel Specialists)
├── Backend Specialist (routes, controllers, services)
├── Frontend Specialist (components, pages)
├── Database Specialist (schema changes)
└── Each loads own Tier 2 context

Wave 3 (Integration)
├── Integration Specialist validates contracts
├── Test Specialist creates tests
└── Cross-component validation

Wave 4 (Finalization)
├── Orchestrator reviews all changes
├── Quality gate checks
└── Final integration validation
```

## Context Budgeting

### Token Limits Per Agent

| Agent | Max Context | Focus |
|-------|-------------|-------|
| Orchestrator | 8K tokens | Task decomposition only |
| Backend Specialist | 32K tokens | Routes, controllers, services |
| Frontend Specialist | 32K tokens | Components, pages, hooks |
| Database Specialist | 16K tokens | Schema, migrations |
| API Specialist | 16K tokens | Route design, validation |
| Test Specialist | 24K tokens | Test files, fixtures |
| Integration Specialist | 24K tokens | Cross-cutting concerns |

### Context Loading Rules

```yaml
# What each agent receives
orchestrator:
  always_include:
    - ai/guides/CLAUDE.md (summary section only)
    - Task description
  never_include:
    - Full source code
    - Test files

backend_specialist:
  always_include:
    - backend/prisma/schema.prisma
    - Relevant routes/*.js
    - Relevant controllers/*.js
    - Relevant services/*.js
  load_on_demand:
    - Related test files
    - Socket utilities

frontend_specialist:
  always_include:
    - frontend/src/types/index.ts
    - Relevant app/**/page.tsx
    - Relevant components/*.tsx
  load_on_demand:
    - Context providers
    - Related hooks

database_specialist:
  always_include:
    - backend/prisma/schema.prisma
    - Recent migrations
  never_include:
    - Frontend code
    - Test files
```

## Minimal Context Transfer

### Between Agents

```
Orchestrator → Specialist:
├── Task ID
├── Task description (50-100 words)
├── File paths to modify
├── Constraints/requirements
└── Dependencies on other tasks

Specialist → Orchestrator:
├── Task ID
├── Status (success/failed/blocked)
├── Files modified (paths only)
├── Summary (50-100 words)
└── Blockers (if any)
```

### Example Transfer

```yaml
# Orchestrator → Backend Specialist
task:
  id: "NEG-001"
  type: "feature"
  description: "Create negotiation service with create, counter, accept, decline operations"
  files:
    create:
      - backend/src/services/negotiationService.js
      - backend/src/controllers/negotiationController.js
      - backend/src/routes/negotiations.js
    modify:
      - backend/src/routes/index.js
  constraints:
    - Follow existing service patterns
    - Emit socket events for status changes
    - Use Prisma transactions for multi-step operations
  depends_on: ["DB-001"]  # Schema must be ready

# Backend Specialist → Orchestrator
result:
  task_id: "NEG-001"
  status: "success"
  files_modified:
    - backend/src/services/negotiationService.js
    - backend/src/controllers/negotiationController.js
    - backend/src/routes/negotiations.js
    - backend/src/routes/index.js
  summary: |
    Created negotiation service with CRUD operations.
    Added socket emissions for status changes.
    Used transactions for accept/decline operations.
  contracts_exposed:
    - "POST /api/negotiations"
    - "PUT /api/negotiations/:id/counter"
    - "PUT /api/negotiations/:id/accept"
    - "PUT /api/negotiations/:id/decline"
```

## Dependency Resolution

### Task Dependencies

```
Database Schema Change
└── Backend Service
    ├── API Routes
    └── Socket Events
        └── Frontend Components
            └── Integration Tests
```

### Blocking Rules

1. **Hard Dependencies**: Must complete before dependent task starts
   - Schema changes → Service implementation
   - API routes → Frontend API calls

2. **Soft Dependencies**: Can proceed with assumptions
   - Tests can be written with mocked responses
   - Frontend can use TypeScript interfaces before API exists

3. **No Dependencies**: Can run in parallel
   - Unrelated backend services
   - Unrelated frontend pages

## Context Refresh Strategy

### When to Refresh

```javascript
// Refresh context when:
// 1. Task depends on recently modified file
// 2. Schema has changed
// 3. API contracts have changed

const shouldRefresh = (task, modifiedFiles) => {
  const taskDependencies = getTaskDependencies(task);
  return taskDependencies.some(dep => modifiedFiles.includes(dep));
};
```

### Stale Context Prevention

```yaml
# Each agent tracks file versions
file_versions:
  "backend/prisma/schema.prisma": "2024-12-26T10:00:00Z"
  "backend/src/services/auctionService.js": "2024-12-26T09:30:00Z"

# Before using context, validate freshness
validation:
  max_age: 300  # seconds
  on_stale: refresh
```

## Error Handling

### Task Failure

```yaml
on_failure:
  - Log error details
  - Mark task as failed
  - Notify orchestrator
  - Check if blockers can be resolved
  - Retry with fresh context (max 2 retries)
```

### Context Overload

```yaml
on_context_limit:
  - Summarize large files
  - Exclude test files
  - Load only relevant sections
  - Split task into smaller subtasks
```

## Metrics

### Track Per Session

```
- Total context tokens used
- Context refresh count
- Task completion rate
- Average task duration
- Retry count
- Blocked task count
```

---

**Last Updated**: 2025-12-26
