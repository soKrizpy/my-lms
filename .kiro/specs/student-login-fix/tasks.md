# Implementation Plan: Student Dashboard API Crash Fix

## Overview

This task list follows the exploratory bugfix workflow with property-based testing to understand, verify, and fix the student dashboard crash on login.

---

## Phase 1: Explore Bug Condition

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Dashboard crashes on null/undefined query responses
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **GOAL**: Surface counterexamples that demonstrate the bug (null query responses cause crashes)
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to concrete failing cases where Supabase queries return null/undefined
  - Test implementation details from Bug Condition in design (isBugCondition pseudocode)
  - Test that dashboard API endpoint crashes when:
    - `topics` query returns null
    - `meetings` query returns undefined
    - `topic_progress` query returns null
    - Result: endpoint throws exception instead of returning 200 with safe defaults
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Cannot read property 'map' of undefined on topics response")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

---

## Phase 2: Verify Preservation

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Dashboard works with complete valid query data
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (valid Supabase responses)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - When all queries return valid data, dashboard endpoint returns 200
    - Meeting sorting by date and filtering logic works correctly
    - Topic unlock logic correctly maps joins/engine completion to unlock status
    - Module unlock percentages calculate correctly
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

---

## Phase 3: Implement Fix

- [x] 3. Fix dashboard API crash from null/undefined responses

  - [x] 3.1 Add error handling to topicUnlock.ts
    - Wrap all Supabase queries with error handling (try-catch or result validation)
    - Treat null/undefined query responses as empty arrays instead of crashing
    - Validate array bounds before accessing elements with modulo operation
    - Add optional chaining for all nested property access (`?.`)
    - Use null coalescing operators (`??`) for safe defaults
    - Example: `const topics = data?.topics || []` instead of direct access
    - Ensure `meeting = meetingsList[meetingIdx]` handles empty meetingsList safely
    - _Bug_Condition: isBugCondition(query_response) where query returns null/undefined_
    - _Expected_Behavior: expectedBehavior(result) - graceful handling, no crash_
    - _Preservation: Non-null queries continue to work with same unlock logic_
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Add error handling to dashboard route.ts
    - Wrap entire endpoint in try-catch block
    - Add error checking after each Supabase query
    - Use optional chaining for all nested object access (e.g., `sm.modules?.id`, `m.meeting_students?.[0]?.has_joined`)
    - Provide safe defaults using null coalescing (e.g., `meetings || []`, `announcements?.[0]?.content || null`)
    - Return 500 with error details only for critical failures (user auth, essential module fetch)
    - For non-critical failures (quiz attempts, announcements), continue with partial data
    - Ensure response always includes all required fields from spec
    - _Bug_Condition: isBugCondition where nested objects or arrays are undefined_
    - _Expected_Behavior: Endpoint returns 200 even with partial data missing_
    - _Preservation: When all data is valid, dashboard works exactly as before_
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.3 Test fix against bug condition
    - **Property 1: Expected Behavior** - Dashboard handles null responses gracefully
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1 against fixed code
    - Test should verify dashboard returns 200 with safe defaults when queries return null
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Document which code paths now handle null/undefined safely
    - _Requirements: Expected Behavior Properties from design_

  - [x] 3.4 Test fix against preservation
    - **Property 2: Preservation** - Dashboard behavior unchanged for valid data
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2 against fixed code
    - Tests should verify:
      - Meeting sorting/filtering still works correctly
      - Topic unlock logic produces same results
      - Module percentages calculate same as before
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions introduced)
    - _Requirements: Preservation Requirements from design_

---

## Phase 4: Validate

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite for dashboard endpoint
  - Verify bug condition test passes (fix is working)
  - Verify preservation tests pass (no regressions)
  - Manually test student login flow end-to-end:
    - Student logs in with valid credentials
    - Dashboard loads without server errors
    - Dashboard displays modules, topics, and meeting information correctly
  - Verify error logging captures any unexpected query failures
  - Document test results and any edge cases discovered
  - Confirm implementation is complete and ready for review

