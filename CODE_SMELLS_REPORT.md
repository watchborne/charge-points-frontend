# Code Smell Inspection Report

**Date:** 2026-09-18
**Total Code Smells Found:** 20

---

## Summary by Repository

| Repository             | Smells | Status          |
| ---------------------- | ------ | --------------- |
| charge-points-server   | 13     | ⚠️ Needs Review |
| charge-points-frontend | 7      | ⚠️ Needs Review |
| charge-points-types    | 0      | ✅ Clean        |
| electrons              | 0      | ✅ Clean        |

---

## Detailed Findings

### 1. charge-points-server (13 smells)

#### 1.1 Magic Numbers in WebSocket Handling

- **File:** `src/protocol/server.ts`, `src/infrastructure/ws/broadcast.ts`
- **Category:** Consistency (Intentionality)
- **Issue:** Hardcoded values like `1` for `WebSocket.OPEN`, `300` ms grace periods, `30` second timeouts scattered throughout
- **Fix:** Extract magic numbers to `src/config.ts` as named constants

#### 1.2 Inefficient Array Search

- **File:** `src/infrastructure/ws/broadcast.ts` (line ~45)
- **Category:** Software Quality (Reliability)
- **Issue:** Uses `chargePointIds.includes(id)` in a loop - O(n²) complexity when it should be O(1)
- **Fix:** Convert `chargePointIds` to a `Set` before the loop for O(1) lookups

#### 1.3 Duplicated Client Cleanup Logic

- **File:** `src/infrastructure/ws/client-registry.ts`
- **Category:** Software Quality (Maintainability)
- **Issue:** Client removal/cleanup logic appears 3+ times with identical code
- **Fix:** Extract into a shared `removeClient()` helper method

#### 1.4 Type Safety Bypass with `any`

- **File:** `src/app.ts` (hot-reload globals)
- **Category:** Software Quality (Reliability)
- **Issue:** `@typescript-eslint/no-explicit-any` used to bypass type checking on module hot-reload state
- **Fix:** Create a proper TypeScript interface for hot-reload globals instead of using `any`

#### 1.5 Silent Error in Hot-Reload Close

- **File:** `src/app.ts` (Fastify app close)
- **Category:** Software Quality (Reliability)
- **Issue:** Fastify app close failure during hot-reload is caught but not logged, masking shutdown issues
- **Fix:** Add structured logging to hot-reload error path

#### 1.6 Uncaught JSON.parse in Message Router

- **File:** `src/protocol/handlers/router.ts`
- **Category:** Software Quality (Reliability)
- **Issue:** `JSON.parse()` called without try-catch when parsing WebSocket messages
- **Fix:** Wrap in try-catch and handle `SyntaxError` with proper error response

#### 1.7 Missing Connection State Validation

- **File:** `src/protocol/server.ts`
- **Category:** Software Quality (Reliability)
- **Issue:** No validation that WebSocket is in `OPEN` state before sending messages
- **Fix:** Add guard checks before `ws.send()` calls

#### 1.8 Hardcoded Request Timeout

- **File:** `src/application/commands/get-variables.command-handler.ts`
- **Category:** Consistency (Adaptability)
- **Issue:** 30-second timeout is hardcoded; should be configurable
- **Fix:** Move to `src/config.ts` as `OCPP_REQUEST_TIMEOUT`

#### 1.9 Missing Error Context in Handlers

- **File:** `src/application/commands/*.command-handler.ts` (multiple)
- **Category:** Software Quality (Maintainability)
- **Issue:** Errors returned without sufficient context (file, handler, parameters) for debugging
- **Fix:** Include structured error context in `fail()` calls

#### 1.10 Implicit Null Handling

- **File:** `src/infrastructure/store/charge-point-repository.ts`
- **Category:** Software Quality (Reliability)
- **Issue:** Repository methods return `null` without explicit documentation of when this occurs
- **Fix:** Add JSDoc `@returns` documenting null case for each method

#### 1.11 Mixed Concerns in WebSocket Router

- **File:** `src/infrastructure/ws/router.ts`
- **Category:** Consistency (Responsibility)
- **Issue:** Router handles parsing, validation, routing, and error formatting in one function
- **Fix:** Split into separate validation, routing, and formatting steps

#### 1.12 No Retry Logic for Transient Failures

- **File:** `src/protocol/handlers/status-notification.handler.ts`
- **Category:** Software Quality (Reliability)
- **Issue:** Single-attempt storage writes could fail on transient DB errors with no retry
- **Fix:** Add exponential backoff retry for database operations

#### 1.13 Unsafe String Concatenation in Logging

- **File:** `src/infrastructure/ws/broadcast.ts` (logging)
- **Category:** Software Quality (Security)
- **Issue:** User input (charge point IDs, message content) concatenated directly in log strings
- **Fix:** Use structured logging with fields instead of string interpolation

---

### 2. charge-points-frontend (7 smells)

#### 2.1 Hardcoded Reconnection Logic

- **File:** `app/[locale]/app/ws/ws-manager.ts` (line ~120)
- **Category:** Consistency (Adaptability)
- **Issue:** Base delay `1000ms`, max retries `10`, backoff multiplier hardcoded without configuration
- **Fix:** Extract to `lib/constants.ts` as `WS_RECONNECT_*` constants

#### 2.2 Console.error Instead of Structured Logging

- **File:** `app/api/*/route.ts` (multiple files)
- **Category:** Software Quality (Maintainability)
- **Issue:** Errors logged to console instead of Sentry or structured error tracking
- **Fix:** Replace `console.error()` with Sentry.captureException() for all error cases

#### 2.3 Missing Network Error Handling

- **File:** `lib/proxy-request.ts` (line ~45)
- **Category:** Software Quality (Reliability)
- **Issue:** `fetch()` can throw NetworkError before reaching `.ok` check, leaving caller with no error
- **Fix:** Wrap fetch in try-catch to handle network-level failures

#### 2.4 Hardcoded Content-Type Response

- **File:** `app/api/charge-points/route.ts`
- **Category:** Consistency (Intentionality)
- **Issue:** Hardcoded `Content-Type: application/json` regardless of what backend actually returns
- **Fix:** Forward the backend's `Content-Type` header from the proxy response

#### 2.5 Silent Token Fetch Failures

- **File:** `app/api/ws-token/route.ts`
- **Category:** Software Quality (Reliability)
- **Issue:** Token fetch failure returns empty token without error state, client connects with invalid token
- **Fix:** Return 500 with error details when token generation fails

#### 2.6 Magic Number in Rate Limiting

- **File:** `lib/http-client.ts`
- **Category:** Consistency (Intentionality)
- **Issue:** Retry delay `100ms` is hardcoded with no explanation
- **Fix:** Extract to `lib/constants.ts` as `HTTP_RETRY_DELAY_MS` with explanatory comment

#### 2.7 No Request Timeout

- **File:** `lib/http-client.ts` (fetch calls)
- **Category:** Software Quality (Reliability)
- **Issue:** Fetch requests have no timeout - can hang indefinitely on slow network
- **Fix:** Add `AbortController` with 30-second timeout to all fetch calls

---

### 3. charge-points-types (0 smells)

✅ No code smells detected. Clean schema-first architecture with proper separation of concerns.

---

### 4. electrons (0 smells)

✅ No code smells detected. Well-maintained component library with clear responsibility boundaries.

---

## Recommendations by Priority

### 🔴 High Priority (Security & Reliability)

1. **Uncaught JSON.parse** in protocol router - can crash server
2. **Unsafe string concatenation** in logging - potential log injection
3. **Missing network timeout** - requests can hang forever
4. **Uncaught token fetch failures** - invalid tokens compromise security

### 🟡 Medium Priority (Maintainability & Performance)

1. **Duplicated client cleanup** - 3x code duplication leads to bugs
2. **Magic numbers** everywhere - makes code hard to configure/maintain
3. **Inefficient array search** - O(n²) performance in hot path
4. **Mixed concerns in router** - hard to test/maintain

### 🔵 Low Priority (Consistency & Code Quality)

1. Extract magic numbers to config
2. Replace console.error with structured logging
3. Add error context to handler responses
4. Document null-return cases in repositories

---

## Files Affected by Repository

### charge-points-server

- src/protocol/server.ts
- src/protocol/handlers/router.ts
- src/protocol/handlers/status-notification.handler.ts
- src/application/commands/get-variables.command-handler.ts
- src/infrastructure/ws/broadcast.ts
- src/infrastructure/ws/client-registry.ts
- src/infrastructure/ws/router.ts
- src/infrastructure/store/charge-point-repository.ts
- src/app.ts
- src/config.ts (needs new constants)

### charge-points-frontend

- lib/proxy-request.ts
- lib/http-client.ts
- lib/constants.ts (needs additions)
- app/api/ws-token/route.ts
- app/api/charge-points/route.ts
- app/[locale]/app/ws/ws-manager.ts
- app/api/\*/route.ts (multiple files)

---

**Generated by Claude Code** | Session ID: 013dzgE6yzB5xrS9mJXujRQH
