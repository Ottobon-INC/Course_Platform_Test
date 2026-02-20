# Abstract System Design Issues

This document abstracts the specific issues identified in the Course Platform into generalized architectural anti-patterns. Recognizing these abstract forms allows for easier identification of similar issues in future developments.

## 1. Code Quality & Modularity

### The "Logic Fragmentation" Anti-Pattern
**Context**: Core business logic (e.g., resolving IDs, calculating permissions) is required in multiple entry points (routes, jobs, websockets).
**Specific Issue**: Duplicated functions across various route files.

**Abstract Manifestation**:
```typescript
// File A (Route)
function resolveEntity(id) { /* logic */ }

// File B (Another Route)
function resolveEntity(id) { /* logic copied */ }
```
**Consequences**:
-   **Divergent Behavior**: Updates to logic in File A are often missed in File B.
-   **Maintenance Overhead**: Developers must "hunt and peck" to find all instances of a rule.

### The "Controller Concern Overload" (The Fat Controller)
**Context**: Handling an HTTP request involves parsing, validation, database operations, and response formatting.
**Specific Issue**: Routes contain 300-800+ lines mixing HTTP/DB/Business logic.

**Abstract Manifestation**:
```typescript
router.post("/entity", async (req, res) => {
  // 1. Validation Logic
  if (!req.body.name) return res.status(400)...;
  
  // 2. Business Logic
  if (req.body.type === 'special') { ... }

  // 3. Database Logic
  const result = await db.query("INSERT INTO ...");
  
  // 4. Response Logic
  res.json(result);
});
```
**Consequences**:
-   **Untestable Logic**: Cannot test business rules without mocking the entire HTTP stack.
-   **Low Reusability**: Logic embedded in the route cannot be called by a background job.

### The "Configuration Dispersion" Anti-Pattern
**Context**: System behavior depends on tunable values (timeouts, limits, feature flags).
**Specific Issue**: Hardcoded constants and magic numbers scattered in implementation files.

**Abstract Manifestation**:
```typescript
// Inside a deep utility function
setTimeout(() => { ... }, 5000); // Why 5000? 

// Inside a route
if (items.length > 50) { ... } // Who decided 50?
```
**Consequences**:
-   **Opaque System Behavior**: Impossible to see the system's "settings" in one view.
-   **Deployment rigidity**: Changing a timeout requires a code deploy, not an env var change.

---

## 2. Performance & Efficiency

### The "Database Query Amplification" (N+1 Problem)
**Context**: Retrieving a list of "Parent" entities and their associated "Child" details.
**Specific Issue**: Fetching collections then looping to make queries.

**Abstract Manifestation**:
```typescript
const parents = await db.getParents(); // 1 Query
for (const parent of parents) {
  // N Queries (Executed sequentially or in parallel)
  parent.child = await db.getChild(parent.id); 
}
```
**Consequences**:
-   **Latency Explosion**: Network round-trips dominate the request time.
-   **Database Saturation**: A single API call can consume hundreds of DB connections.

### The "Redundant Computation" Anti-Pattern
**Context**: Retrieving data or computing results that change infrequently (e.g., configurations, metadata, embeddings).
**Specific Issue**: No query caching for expensive operations.

**Abstract Manifestation**:
```typescript
// Called on every single request
function getSystemConfig() {
  return db.expensiveQuery("SELECT * FROM heavily_joined_config_table");
}
```
**Consequences**:
-   **Resource Waste**: CPU and DB I/O spent re-calculating known values.
-   **Throughput Ceiling**: overall system capacity is capped by the speed of the slowest common dependency.

### The "Resource Starvation Configuration"
**Context**: Connecting to limited shared resources (like a Database) from a scalable application tier.
**Specific Issue**: Using default connection pool sizes without load tuning.

**Abstract Manifestation**:
```typescript
const db = new Client({
  // defaults usually assume low-concurrency dev environments
  poolSize: 10 // Too small for production load
});
```
**Consequences**:
-   **Artificial Bottlenecks**: Application waits for connections even when DB CPU is idle.
-   **Request Timeouts**: Queue time exceeds client timeout thresholds.

---

## 3. Reliability & Scalability

### The "Instance-Local State" Anti-Pattern
**Context**: Managing transient state like rate limits, user sessions, or job locks.
**Specific Issue**: In-Memory Rate Limiting.

**Abstract Manifestation**:
```typescript
const requestCounts = new Map(); // Stored in RAM of *this* process

function rateLimit(ip) {
  requestCounts.set(ip, (requestCounts.get(ip) || 0) + 1);
}
```
**Consequences**:
-   **Inconsistent Enforcement**: A user hitting Server A is limited, but hitting Server B is fresh.
-   **Data Loss**: All state vanishes on restart/deploy.
-   **Scaling Failure**: Adding more servers doesn't scale the logic correctly.

### The "Synchronous Dependency Coupling"
**Context**: Executing operations that depend on external, potentially slow services (AI APIs, Payment Gateways).
**Specific Issue**: Synchronous OpenAI API calls.

**Abstract Manifestation**:
```typescript
router.post("/generate", async (req, res) => {
  // Holds the HTTP connection open for 10s-60s
  const result = await externalService.process(req.body); 
  res.json(result);
});
```
**Consequences**:
-   **Thread Starvation**: In single-threaded runtimes (Node.js), event loop is blocked or slots are filled waiting.
-   **Cascading Failure**: If the external service slows down, the entire API becomes unresponsive.

### The "Unconstrained Data Transmission"
**Context**: API endpoints returning collections of data.
**Specific Issue**: Returning all records without pagination.

**Abstract Manifestation**:
```typescript
router.get("/logs", async (req, res) => {
  // Returns 10,000,000 rows if the table grows
  const logs = await db.logs.findMany(); 
  res.json(logs);
});
```
**Consequences**:
-   **Memory Exhaustion (OOM)**: Server attempts to buffer huge JSON strings.
-   **Network Congestion**: Massive payloads saturate bandwidth.
-   **Slow Client Rendering**: Frontend freezes trying to render thousands of DOM nodes.
