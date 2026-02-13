# Abstract System Design Patterns

This document provides generalized, reusable templates of the design patterns identified in the Course Platform. These abstractions can be applied to future features or different projects to ensure architectural consistency.

## 1. Creation & Access Control

### The "Safe Singleton" Pattern
**Use Case**: Managing shared resources like Database Connections, Redis Clients, or WebSocket Servers where multiple instances could cause resource exhaustion or race conditions.

**Abstract Implementation**:
```typescript
// resource.ts
let instance: ResourceType | undefined;

export function getResource(): ResourceType {
  if (!instance) {
    instance = initializeResource(); // Expensive operation
  }
  return instance;
}

// For Hot-Reload Environments (Dev Mode Guard):
if (process.env.NODE_ENV !== "production") {
  global.resourceInstance = instance;
}
```

## 2. API & Data Flow

### The "Route-Service-Data" Facade
**Use Case**: Organizing Backend Logic to prevent "Fat Controllers" and leaking DB details to the API layer.

**Abstract Structure**:
1.  **Router (Controller)**: Handles HTTP concerns (Request parsing, Validation, Response formatting).
    -   *Rule*: Never import database models directly.
2.  **Service (Facade)**: Contains the Business Logic.
    -   *Rule*: Accepts plain arguments, returns plain objects (DTOs). Handles transactions.
3.  **Data Access**: The ORM or Repository.
    -   *Rule*: Only accessed by the Service.

**Template**:
```typescript
// Controller
route.post("/item", async (req, res) => {
    const validData = validate(req.body);
    const result = await service.createItem(validData); // Facade call
    res.json(result);
});

// Service
async function createItem(data) {
    if (checkBusinessRule(data)) {
        return db.insert(data);
    }
}
```

## 3. Asynchronous Operations

### The "Persistent Command Queue" Pattern
**Use Case**: Handling tasks that take longer than a standard HTTP timeout (approx 30s-60s), such as AI generation, video processing, or report generation.

**Abstract Components**:
1.  **Command Table** (`jobs`):
    -   Columns: `id`, `type`, `status` (PENDING, PROCESSING, COMPLETED, FAILED), `payload`, `result`.
2.  **Producer (API)**:
    -   Action: Inserts row into `jobs` → Returns `job_id` immediately (HTTP 202 Accepted).
3.  **Consumer (Worker)**:
    -   Action: Periodically polls `jobs` for PENDING items -> Locks row -> Processes -> Updates `status`.
4.  **Observer (Client)**:
    -   Action: Polls `GET /jobs/:id` OR listens to SSE `/jobs/:id/stream`.

**Recovery Strategy**:
-   Worker must support "Stale Lock Recovery" (resetting PROCESSING jobs to PENDING if `locked_at` > timeout) to handle crashes.

## 4. Personalization & Variation

### The "Content Resolution Strategy" Pattern
**Use Case**: Serving different versions of the same entity (Content, Email, Notification) based on User Attributes (Persona, Region, Subscription).

**Abstract Implementation**:
1.  **Base Entity**: Contains the default/generic content.
2.  **Variant Asset**: Contains the specialized content, linked by a `variant_key`.
3.  **Resolver**:
    -   Input: `BaseEntity`, `UserContext`.
    -   Logic:
        1.  Determine `variant_key` from `UserContext` (e.g., User is "Expert").
        2.  Check if `BaseEntity` has an override for "Expert".
        3.  If yes, Merge/Replace.
        4.  If no, Return Default.

**Benefit**: Decouples the "Personalization Rules" from the "Content Rendering".

## 5. Security & Validation

### The "Guard Chain" (Chain of Responsibility)
**Use Case**: Enforcing cross-cutting concerns (Auth, Rate Limiting, Logging) on API routes.

**Abstract Structure**:
```typescript
const middlewareChain = [
    rateLimiter,   // 1. Stop DOS
    authGuard,     // 2. Stop Unauthenticated
    roleGuard,     // 3. Stop Unauthorized
    validation,    // 4. Stop Bad Data
    controller     // 5. Execute Logic
];
```
**Rule**: Each link in the chain should be self-contained and unaware of the next link's logic. Fail early.

---

## Usage Guide
When implementing a new feature, scan this list:
1.  **New External Resource?** -> Apply **Safe Singleton**.
2.  **Complex Data Logic?** -> Apply **Service Facade**.
3.  **Long-Running Task?** -> Apply **Persistent Command Queue**.
4.  **Personalized Output?** -> Apply **Resolution Strategy**.
