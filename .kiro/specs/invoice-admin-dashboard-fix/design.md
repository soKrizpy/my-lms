# Invoice Admin Dashboard Bugfix Design

## Overview

The invoice admin dashboard (`/admin/invoices`) has two failures: the invoice list shows stale data after any mutating action (status change, edit save, or invoice generation), and newly generated invoices do not appear in the list after a successful generate call.

Both failures share the same root cause. `page.tsx` is a `"use client"` component, so all `fetch()` calls are plain **browser fetch** — the Next.js server-side cache layer does not apply. The browser, however, will cache GET responses that lack an explicit `Cache-Control: no-store` header. Because the GET route handler (`/api/admin/invoices`) never sets cache-control response headers, the browser may serve a stale cached response on subsequent calls to the same URL within the same session.

The fix requires two targeted changes:
1. Add `Cache-Control: no-store` to the GET route handler's response so the browser never caches invoice list results.
2. Add `cache: 'no-store'` to the `fetch()` call in `fetchInvoices` inside `page.tsx` as a defence-in-depth measure.

No other files require changes. The generate route, PUT route, and all UI re-fetch logic in `page.tsx` are already correct.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers stale data — a `fetchInvoices` call that receives a cached HTTP response instead of fresh database results.
- **Property (P)**: The desired behavior — every `fetchInvoices` call returns the current state of the `invoices` table in the database.
- **Preservation**: All existing behaviors unrelated to caching (generation logic, status update flow, edit modal save, month-picker re-fetch, duplicate-prevention in generate) must remain unchanged.
- **`fetchInvoices`**: The async function in `page.tsx` that calls `GET /api/admin/invoices?monthYear=...` and sets the `invoices` state.
- **`handleGenerate`**: The async function in `page.tsx` that calls `POST /api/admin/invoices/generate` and then calls `fetchInvoices` on success.
- **`handleUpdateStatus`**: The async function in `page.tsx` that calls `PUT /api/admin/invoices` and then calls `fetchInvoices` on success.
- **`onSaved` callback**: The prop passed to `InvoiceModal` that closes the modal and calls `fetchInvoices` after a successful PUT.
- **Browser HTTP cache**: The cache maintained by the browser for HTTP responses. Applies to all `fetch()` calls from client components. Distinct from the Next.js server-side data cache.
- **`Cache-Control: no-store`**: HTTP response header that instructs the browser and any intermediate caches never to store the response.

---

## Bug Details

### Bug Condition

The bug manifests when `fetchInvoices` is called (on mount, on month change, or after a mutation) and the browser returns a cached GET response for `/api/admin/invoices?monthYear=...` instead of forwarding the request to the server. Because the route handler sets no `Cache-Control` header, the browser applies its default caching heuristics and may serve the previously stored response.

The generate action's failure to show new invoices is a consequence of the same condition: the POST succeeds and `fetchInvoices` is called, but the GET response comes from the browser cache, which still reflects the pre-generation state.

**Formal Specification:**
```
FUNCTION isBugCondition(request)
  INPUT: request — a call to fetchInvoices(monthYear)
  OUTPUT: boolean

  RETURN browserCache.has(GET /api/admin/invoices?monthYear=monthYear)
         AND responseHeaders["Cache-Control"] does NOT contain "no-store"
         AND browserCache.get(...) !== currentDatabaseState
END FUNCTION
```

### Examples

- **Status update goes unshown**: Admin clicks "Kirim" on a draft invoice. PUT succeeds. `fetchInvoices` is called. Browser returns cached response with `status: "draft"`. Dashboard still shows "DRAFT". *(Expected: "SENT")*
- **Edit save not reflected**: Admin edits price in InvoiceModal, saves. PUT succeeds. Modal closes, `fetchInvoices` is called. Browser returns cached response with old price. Dashboard shows old value. *(Expected: updated price)*
- **Generated invoices missing**: Admin clicks "Generate Invoice", confirms. POST succeeds, alert says "Berhasil generate N invoice". `fetchInvoices` is called. Browser returns cached empty list. Dashboard stays empty. *(Expected: N new draft invoices listed)*
- **Month-picker stale data**: Admin switches to a month previously viewed. `fetchInvoices` is called. Browser returns cached response from the earlier visit. New invoices added since then are not shown. *(Expected: current database state)*

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- On page load, the dashboard SHALL continue to automatically fetch invoices for the default month (previous calendar month).
- When the month picker changes, the dashboard SHALL continue to re-fetch invoices for the newly selected month.
- The "Generate Invoice" button SHALL continue to be disabled while generation is in progress and re-enabled after completion.
- The generate action SHALL continue to skip creating invoices for students who already have an invoice for the selected month (no duplicates).
- The generate action SHALL continue to return zero generated invoices without error when no meetings exist for the month.
- Saving an edit in `InvoiceModal` SHALL continue to calculate `total_amount` as `attended_meetings × price_per_meeting` before persisting.
- The early-month reminder banner SHALL continue to appear when `date ≤ 7` and be dismissible for the rest of the session.
- All PUT and POST operations SHALL continue to function correctly with their current request bodies and response handling.

**Scope:**
All code paths that do NOT involve the `fetchInvoices` GET request are unaffected by this fix. This includes:
- The PUT route handler (`route.ts`)
- The POST generate route handler (`generate/route.ts`)
- The `InvoiceModal` component's save logic
- The month-picker state and `useEffect` wiring
- The reminder banner logic

---

## Hypothesized Root Cause

Based on code review and analysis of the Next.js version in use:

1. **Missing `Cache-Control: no-store` on the GET route response**: The route handler at `app/api/admin/invoices/route.ts` constructs its response with `NextResponse.json(data)` and sets no cache headers. The browser therefore applies default heuristics and may cache the response, serving it on subsequent requests to the same URL within the same session.

2. **Missing `cache: 'no-store'` on the client-side `fetch` call**: The `fetchInvoices` function in `page.tsx` calls `fetch('/api/admin/invoices?monthYear=...')` with no options. This is a plain browser fetch; it respects whatever `Cache-Control` the response carries (or the absence of one).

3. **Why the generate action appears to "do nothing"**: The POST to `/api/admin/invoices/generate` succeeds (the alert confirms this). The subsequent `fetchInvoices` call is made correctly. The stale browser cache intercepts the GET request and returns the pre-generation snapshot, making it appear as if generation had no effect.

4. **No server-side cache involvement**: Because `page.tsx` is a `"use client"` component, Next.js's server-side data cache (which uses `cache: 'force-cache'` / `'no-store'` semantics) does not apply. The fix does not require `export const dynamic = 'force-dynamic'` or any route segment config changes on the API routes.

---

## Correctness Properties

Property 1: Bug Condition - Invoice List Always Reflects Current Database State

_For any_ call to `fetchInvoices(monthYear)` — whether triggered on mount, by a month-picker change, or after a mutation (generate, status update, or edit save) — the fixed implementation SHALL return the current state of the `invoices` table from the database, not a cached response from a prior request.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Fetch Behaviors Remain Unchanged

_For any_ action that does NOT go through the `fetchInvoices` GET path (i.e., PUT status updates, PUT invoice edits, POST generate, month-picker state changes, reminder banner toggle), the fixed code SHALL produce exactly the same behavior as the original code — same request bodies, same response handling, same UI transitions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

---

## Fix Implementation

### Changes Required

**File 1**: `app/api/admin/invoices/route.ts`

**Function**: `GET`

**Specific Changes**:
1. **Add `Cache-Control: no-store` to the success response**: Replace `return NextResponse.json(data)` with a response that sets the header, ensuring no browser or intermediate cache stores the invoice list.
   ```ts
   return NextResponse.json(data, {
     headers: { 'Cache-Control': 'no-store' },
   });
   ```
   The error response does not need this header because error responses are not cached by browsers under normal circumstances.

---

**File 2**: `app/admin/invoices/page.tsx`

**Function**: `fetchInvoices`

**Specific Changes**:
1. **Add `cache: 'no-store'` to the fetch call**: This is defence-in-depth — it instructs the browser's fetch implementation to always go to the network, regardless of the response headers.
   ```ts
   const res = await fetch(`/api/admin/invoices?monthYear=${month}`, {
     cache: 'no-store',
   });
   ```
   No other changes to `page.tsx` are required. The `handleGenerate`, `handleUpdateStatus`, and `onSaved` flows already call `fetchInvoices` on success.

---

No changes are needed in:
- `app/api/admin/invoices/generate/route.ts` — POST responses are not cached.
- `app/admin/invoices/InvoiceModal.tsx` — the `onSaved` callback already triggers a re-fetch.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code to confirm the root cause, then verify the fix eliminates the stale-data condition while preserving all existing behaviors.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the stale-cache bug BEFORE implementing the fix. Confirm or refute that the browser cache is the actual cause. If refuted, re-hypothesize.

**Test Plan**: Write tests that mock `fetch` to return a stale first response and a fresh second response for the same URL. Assert that after a mutation callback, the UI renders the fresh data. Run on UNFIXED code to observe that the UI incorrectly shows stale data.

**Test Cases**:
1. **Status update stale data test**: Render the page with mock invoices. Click "Kirim". Assert that after the PUT resolves, the re-fetched list reflects the new status. *(Will fail on unfixed code if browser cache intercepts the second GET)*
2. **Generate then list test**: Render the page for an empty month. Click "Generate Invoice", confirm. Assert the list renders the newly generated invoices after the alert. *(Will fail on unfixed code — GET returns empty cached response)*
3. **Edit save stale data test**: Open `InvoiceModal`, change the price, save. Assert the list reflects the updated price after the modal closes. *(Will fail on unfixed code)*
4. **Month-switch stale data test**: Switch to a month, return to the original month after data changes. Assert the list reflects current state, not the cached snapshot. *(May fail on unfixed code)*

**Expected Counterexamples**:
- The invoice list renders old status/price/count values after a mutating action confirms success.
- Root cause confirmed: the second `fetchInvoices` call receives a cached response because the GET response lacked `Cache-Control: no-store`.

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed implementation returns fresh database data.

**Pseudocode:**
```
FOR ALL fetchInvoices(monthYear) calls WHERE isBugCondition(request) DO
  response := fetchInvoices_fixed(monthYear)
  ASSERT response.headers["Cache-Control"] === "no-store"
  ASSERT response.data === currentDatabaseState(monthYear)
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (i.e., all non-GET-fetch code paths), the fixed code produces the same behavior as the original.

**Pseudocode:**
```
FOR ALL action WHERE NOT isBugCondition(action) DO
  ASSERT fixedCode(action) === originalCode(action)
END FOR
```

**Testing Approach**: Property-based testing is appropriate for preservation checking because it generates a wide range of invoice states (varying month, status, price, attendance) and verifies the PUT and POST flows are unaffected across all of them.

**Test Cases**:
1. **PUT status update preservation**: Verify that clicking "Kirim" or "Tandai Lunas" still sends the correct PUT body and updates state after fix.
2. **Generate no-duplicates preservation**: Verify that generating invoices for a month that already has records still produces zero new invoices and no errors.
3. **Modal save total_amount preservation**: Verify that `total_amount = attended_meetings × price_per_meeting` is still sent in the PUT body after fix.
4. **Reminder banner preservation**: Verify the banner appears when `date ≤ 7` and is dismissed correctly after fix.
5. **Month-picker re-fetch preservation**: Verify changing the month still triggers a `fetchInvoices` call with the new month value.

---

### Unit Tests

- Test that `GET /api/admin/invoices` response includes `Cache-Control: no-store` header.
- Test that `fetchInvoices` in `page.tsx` is called with `cache: 'no-store'` option.
- Test that the generate flow calls `fetchInvoices` after a successful POST.
- Test that the status update flow calls `fetchInvoices` after a successful PUT.
- Test that `InvoiceModal`'s `onSaved` calls `fetchInvoices` and closes the modal.
- Test edge cases: generate for month with no meetings returns 0 generated, generate for month with all invoices existing returns 0 generated.

### Property-Based Tests

- Generate random `Invoice[]` arrays with varying statuses and verify the list renders all entries correctly after a fresh fetch.
- Generate random `price_per_meeting` values and verify `total_amount = attended_meetings × price_per_meeting` holds in every PUT body sent from `InvoiceModal`.
- Generate random month strings and verify `fetchInvoices` always uses `cache: 'no-store'` regardless of the month value.

### Integration Tests

- Full flow: load dashboard → generate invoices → assert list shows new drafts.
- Full flow: load dashboard → mark invoice as sent → assert list reflects "SENT" status.
- Full flow: load dashboard → open edit modal → change price → save → assert list reflects new price and recalculated total.
- Full flow: navigate away and return to a month → assert fresh data is loaded, not a cached snapshot.
