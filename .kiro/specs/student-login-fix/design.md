# Design: Student Dashboard API Crash on Login

## Overview

After successful authentication, the student dashboard API endpoint crashes when processing meeting and topic progress data from the lesson-engine integration. This prevents students from accessing the dashboard after login succeeds.

## Bug Condition

### C(X): Bug Condition - Missing Error Handling & Unprotected Null References

The crash occurs when any of the following conditions are met:

1. **Supabase Query Failures in topicUnlock.ts**
   - `topics` query returns null/undefined (network error, permission issue, malformed response)
   - `meetings` query returns null/undefined 
   - `topic_progress` query returns null/undefined
   - Without error handling, code attempts to call `.map()` or `.filter()` on undefined/null

2. **Array Access Without Bounds Checking**
   - Line in `topicUnlock.ts`: `meeting = meetingsList[meetingIdx]` where meetingIdx could exceed array bounds
   - Accessing nested properties without null checks: `meeting?.meeting_students?.[0]?.has_joined`
   - In `dashboard/route.ts`: Direct array access on potentially undefined or empty results

3. **Unprotected Property Chain Access**
   - `sm.modules` access without checking if modules populated
   - `quiz.topic_id` and similar nested objects without validation
   - `t.meeting_students[0]?.has_joined` where `meeting_students` might be undefined

### isBugCondition Pseudocode

```
isBugCondition(query_response) ::= 
  (query_response == null OR query_response == undefined) AND 
  (code_attempts_array_method(query_response) OR code_accesses_nested_property(query_response))
```

## Expected Behavior

### P(result): Property - Dashboard Returns Successfully Without Crashing

When a student logs in and the dashboard API endpoint executes:

1. **Graceful Error Handling**
   - All Supabase queries have try-catch blocks or error checking
   - Null/undefined responses are treated as empty collections (not fatal)
   - Missing data results in safe defaults or empty arrays, not crashes

2. **Protected Property Access**
   - All array access includes bounds checking or optional chaining
   - All object property chains use optional chaining (`?.`) or null coalescing (`??`)
   - All nested data access has fallback values

3. **Successful API Response**
   - Dashboard API returns 200 with valid data structure
   - Even with partial data (some queries return null), response is constructed with safe defaults
   - Student can access dashboard and see partial data rather than server error

### expectedBehavior Pseudocode

```
expectedBehavior(result) ::=
  (result.status == 200) AND
  (all_queries_have_error_handling) AND
  (no_unprotected_property_access) AND
  (response_contains_safe_defaults_for_missing_data)
```

## Preservation Requirements

### ¬C(X): Non-Buggy Cases - Successful Queries

When all Supabase queries complete successfully and return valid data:

1. **Normal Operation Path**
   - Topics, meetings, and progress data are returned correctly
   - Unlock logic processes data and returns accurate unlock status
   - Dashboard displays modules, topics, and meeting information

2. **Partial Data Path**
   - Some queries succeed, others are empty (zero results)
   - Dashboard still renders with available data
   - No crashes when data subset is empty

### Preservation Properties

1. **Data Integrity**
   - When meetings data is valid, meeting sorting and filtering logic remains unchanged
   - When topic unlock logic receives valid data, unlock calculations remain correct
   - When quiz attempts exist, they are displayed correctly

2. **Existing Logic**
   - Meeting visibility filtering (is_completed, 65-minute rule) continues to work
   - Module unlock percentage calculation remains correct
   - Topic ordering (by module_id, then order_index) remains consistent

## Implementation Notes

### topicUnlock.ts Changes

1. Add error handling around each Supabase query
2. Use empty arrays as defaults when queries fail or return null
3. Ensure array access with modulo operation is safe even with empty arrays
4. Protect nested property access with optional chaining and null coalescing

### dashboard/route.ts Changes

1. Add try-catch around entire endpoint logic
2. Wrap each Supabase query with error handling
3. Use optional chaining for all nested object access
4. Provide safe default values for optional fields
5. Return 500 with error details if critical operation fails; continue with partial data for non-critical failures

### Files to Modify

- `/lib/topicUnlock.ts`
- `/app/api/student/dashboard/route.ts`

## Acceptance Criteria

### 1. Bug Condition Tests Pass

- [ ] Property-based test for null/undefined queries fails on UNFIXED code
- [ ] Test verifies crash occurs when queries return null/undefined
- [ ] Test confirms bug exists before fix

### 2. Preservation Tests Pass

- [ ] Property-based test for valid query data passes on UNFIXED code
- [ ] Test verifies dashboard works with complete valid data
- [ ] Test captures existing behavior to prevent regressions

### 3. Implementation Complete

- [ ] All Supabase queries have error handling
- [ ] All property access is protected with optional chaining/null coalescing
- [ ] Dashboard endpoint returns 200 even with partial data
- [ ] Bug condition tests pass after fix
- [ ] Preservation tests still pass after fix
- [ ] No regression in meeting visibility or unlock logic
