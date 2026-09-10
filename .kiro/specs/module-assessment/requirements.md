# Requirements Document

## Introduction

The Module Assessment (Tryout) feature adds a module-level final test to the Bits2Bytes LMS. After a student completes all topics in a module, a tryout assessment is unlocked. The assessment consists of 10–20 multiple-choice questions authored by an admin directly in the LMS admin panel. Students take the assessment in-browser (no lesson engine iframe required) and may attempt it up to 2 times. Results are persisted per student per module and surfaced on the student dashboard. XP and badge rewards based on assessment results are explicitly out of scope and handled by a future feature.

---

## Glossary

- **Assessment**: A module-level multiple-choice test distinct from per-topic quizzes. One Assessment exists per Module.
- **Assessment_Question**: A single multiple-choice question belonging to an Assessment. Contains question text, four answer options (A–D), and a designated correct option.
- **Assessment_Attempt**: A single submission of an Assessment by a Student. Records the score, total questions, selected answers, and timestamp.
- **Admin**: An authenticated administrator who manages modules, topics, and assessment content via `/admin`.
- **Student**: An authenticated learner who accesses the LMS student interface.
- **Module**: A top-level learning unit containing one or more Topics.
- **Topic**: An individual lesson unit within a Module, tracked in the `topics` table.
- **Topic_Completion**: A record confirming a Student has completed a Topic (a record exists with a non-null `completed_at` value in the progress store).
- **Module_Completion**: The state where every published Topic within a Module has a Topic_Completion record for a given Student.
- **Assessment_Score**: An integer from 0 to 100 representing percentage of correct answers, computed as `ROUND((correct_answers / total_questions) * 100)`.
- **Best_Assessment_Score**: The highest Assessment_Score across all Assessment_Attempts by a Student for a given Assessment. Always `MAX(all attempts)`, never the latest score alone.
- **LMS**: The bits2bytes-lms Next.js application (this repository).
- **Supabase_Admin**: The service-role Supabase client used by all LMS server-side routes (`getSupabaseAdmin()`).

---

## Requirements

### Requirement 1: Assessment Authoring — Create and Configure Assessment

**User Story:** As an Admin, I want to create a module-level assessment with a title and configure its question count bounds, so that each module has exactly one final tryout test.

#### Acceptance Criteria

1. THE LMS SHALL ensure that each Module has at most one Assessment, enforced by a unique constraint on `module_id` in the `module_assessments` table.
2. WHEN an Admin submits a valid create-assessment form for a Module that has no existing Assessment, THE LMS SHALL insert a new Assessment record with the provided title and associate it with the Module.
3. WHEN an Admin requests the assessment management page for a Module, THE LMS SHALL display the existing Assessment if one exists, or display a create-assessment form if none exists.
4. IF an Admin submits a create-assessment form with an empty title, THEN THE LMS SHALL return a validation error and SHALL NOT insert any record.
5. WHEN an Admin updates the title of an existing Assessment, THE LMS SHALL persist the updated title and revalidate the assessment management page.
6. IF an Admin submits a create-assessment form for a Module that already has an existing Assessment, THEN THE LMS SHALL return an error indicating a duplicate assessment and SHALL NOT insert any record.
7. IF an Admin submits a create-assessment form with a title exceeding 255 characters, THEN THE LMS SHALL return a validation error indicating the title length limit and SHALL NOT insert any record.

---

### Requirement 2: Assessment Authoring — Manage Assessment Questions

**User Story:** As an Admin, I want to add, edit, and delete multiple-choice questions for a module assessment, so that I can build a question bank of 10–20 questions per module.

#### Acceptance Criteria

1. THE LMS SHALL allow an Admin to add Assessment_Questions to an Assessment, where each Assessment_Question contains: question text (1–500 characters), four distinct answer options (A, B, C, D, each 1–200 characters), and exactly one correct option identifier (`A`, `B`, `C`, or `D`).
2. WHEN an Admin submits a valid add-question form, THE LMS SHALL insert the Assessment_Question and display the updated question list within 2 seconds without a full page reload.
3. WHEN an Admin submits an add-question form with any required field empty or exceeding its character limit, THE LMS SHALL display a field-level validation error message adjacent to the offending field and SHALL NOT insert any record.
4. WHEN an Admin submits an add-question form where two or more answer options (A, B, C, D) are identical, THE LMS SHALL display a validation error indicating that all four answer options must be distinct and SHALL NOT insert any record.
5. WHEN an Admin edits an existing Assessment_Question and submits valid changes, THE LMS SHALL update the Assessment_Question record and display the updated values within 2 seconds without a full page reload.
6. IF an Admin submits an edit form with any required field empty, exceeding its character limit, or with duplicate answer options, THEN THE LMS SHALL display a field-level validation error and SHALL NOT update the record.
7. WHEN an Admin deletes an Assessment_Question, THE LMS SHALL permanently remove the Assessment_Question record and update the displayed question count within 2 seconds without a full page reload.
8. THE LMS SHALL display the current question count alongside the question list so that an Admin can track progress toward the 10–20 question target.
9. WHERE an Assessment has 20 Assessment_Questions already, THE LMS SHALL disable the add-question form and display a message indicating the maximum question limit of 20 has been reached.

---

### Requirement 3: Assessment Unlock — Student Eligibility Gate

**User Story:** As a Student, I want the module assessment to become available only after I complete all topics in the module, so that the tryout acts as a meaningful final evaluation.

#### Acceptance Criteria

1. WHILE a Student has not achieved Module_Completion for a given Module, THE LMS SHALL render the Assessment entry point for that Module in a locked state, where the entry point is non-interactive and displays a locked indicator.
2. WHEN a Student achieves Module_Completion (all Topic_Completion records exist for every published Topic in the Module), THE LMS SHALL render the Assessment entry point for that Module in an unlocked state, where the entry point is interactive and displays no locked indicator.
3. THE LMS SHALL determine Module_Completion by verifying that the count of Topic_Completion records with a non-null completion timestamp equals the total count of published Topics for that Module, where a Topic without a completion record or with a null completion timestamp is treated as incomplete.
4. IF a Module has zero published Topics, THEN THE LMS SHALL treat the Assessment for that Module as locked and SHALL NOT present it as available to any Student.
5. WHEN the LMS fetches dashboard data for a Student, THE LMS SHALL re-evaluate Assessment unlock eligibility for each Module and reflect the current lock state in the rendered output without requiring a manual page refresh by the Student.

---

### Requirement 4: Assessment Attempt — Taking the Assessment

**User Story:** As a Student, I want to take the module assessment by answering all questions on a single page and submitting my answers, so that I receive an immediate score.

#### Acceptance Criteria

1. WHEN an unlocked Assessment is opened by a Student, THE LMS SHALL display all Assessment_Questions for that Assessment in a fixed, stable order on a single page, where the order is determined at Assessment creation time and does not change between attempts.
2. WHILE a Student is taking an Assessment, THE LMS SHALL enable the submit button only when exactly one answer option has been selected for every Assessment_Question on the page, and SHALL keep the submit button disabled if any Assessment_Question has no selected answer.
3. WHEN a Student submits an Assessment with all questions answered, THE LMS SHALL compute the Assessment_Score as `ROUND((correct_count / total_questions) * 100)` yielding an integer in the range 0–100, and SHALL persist an Assessment_Attempt record containing: `student_id`, `assessment_id`, `score`, `total_questions`, `correct_count`, selected answers as a JSON map of question ID to selected option, and `submitted_at` timestamp set to the server time at the moment of submission.
4. WHEN an Assessment_Attempt is persisted, THE LMS SHALL update the Student's Best_Assessment_Score for that Assessment to `MAX(existing best score, new score)`, treating a missing prior record as an existing best score of 0.
5. WHEN an Assessment_Attempt is successfully persisted, THE LMS SHALL display the Assessment_Score as an integer percentage (0–100) and the Best_Assessment_Score as an integer percentage (0–100) to the Student on a result screen within the same page, without a full page navigation.
6. WHEN an Assessment_Attempt is successfully persisted, THE LMS SHALL display, for each Assessment_Question on the result screen, the Student's selected answer, whether that answer was correct or incorrect, and the correct answer if the Student's selection was incorrect.
7. IF persisting the Assessment_Attempt fails due to a database error, THEN THE LMS SHALL display an error message indicating the submission could not be saved, and SHALL retain the computed Assessment_Score and all selected answers in the current session state so the Student can retry submission without re-answering questions.
8. IF a Student attempts to submit an Assessment that has already been submitted in the current session, THEN THE LMS SHALL ignore the duplicate submission request and display the existing result screen without creating a new Assessment_Attempt record.

---

### Requirement 5: Assessment Attempt — Attempt Limits

**User Story:** As a Student, I want to be allowed up to 2 attempts at a module assessment, so that I have a chance to improve my score.

#### Acceptance Criteria

1. THE LMS SHALL allow a Student to submit at most 2 Assessment_Attempts per Assessment, enforced server-side before inserting a new attempt record.
2. WHILE a Student has fewer than 2 Assessment_Attempts for an Assessment, THE LMS SHALL display a "Mulai Tryout" action if the Student has 0 recorded attempts, or a "Ulangi Tryout" action if the Student has exactly 1 recorded attempt, that initiates a new attempt.
3. WHEN a Student has exactly 2 Assessment_Attempts for an Assessment, THE LMS SHALL display the Best_Assessment_Score and both attempt scores in descending attempt order, and SHALL NOT render any control that would initiate a third attempt.
4. IF a Student submits an Assessment_Attempt when the Student already has 2 recorded attempts, THEN THE LMS SHALL reject the submission with an error response indicating the attempt limit has been reached, and SHALL NOT insert a third attempt record.
5. WHEN a Student views an Assessment with fewer than 2 recorded attempts, THE LMS SHALL display the remaining attempt count as "Percobaan [current_attempt_number] dari 2", where current_attempt_number equals the count of existing attempts plus 1.
6. IF the server-side attempt-count check fails due to a data retrieval error, THEN THE LMS SHALL reject the submission with an error response indicating a server error, and SHALL NOT insert a new attempt record.

---

### Requirement 6: Assessment Results — Persistence and Display

**User Story:** As a Student, I want to see my assessment results on the dashboard, so that I know my best score and how many attempts I have used.

#### Acceptance Criteria

1. WHEN the Student dashboard loads, THE LMS SHALL include Assessment_Attempt summary data for each Module the Student is enrolled in, containing: `assessment_id`, `attempt_count`, and `best_score`.
2. THE LMS SHALL compute Best_Assessment_Score as the maximum score across all Assessment_Attempts for a given student and assessment pair, where score is a numeric value in the range 0 to 100 inclusive.
3. WHILE a Student has 0 Assessment_Attempts for an unlocked Assessment, THE LMS SHALL display the Assessment entry point as available with no prior score shown.
4. WHILE a Student has 1 Assessment_Attempt for an Assessment, THE LMS SHALL display the Best_Assessment_Score as a numeric value in the range 0 to 100 and indicate that 1 attempt remains.
5. WHILE a Student has 2 Assessment_Attempts for an Assessment, THE LMS SHALL display the Best_Assessment_Score as a numeric value in the range 0 to 100 and indicate that 0 attempts remain.
6. THE LMS SHALL NOT display Assessment results for Modules that the Student is not enrolled in.
7. IF the Student dashboard data load fails, THEN THE LMS SHALL display an error message indicating that Assessment results could not be retrieved and preserve the last successfully loaded Assessment_Attempt summary until the page is refreshed.
8. IF a Student attempts to access an Assessment with 0 remaining attempts, THEN THE LMS SHALL display the Assessment entry point as locked and prevent attempt initiation.

---

### Requirement 7: Admin Assessment Overview

**User Story:** As an Admin, I want to view per-student assessment results for a module, so that I can monitor student performance on the tryout.

#### Acceptance Criteria

1. WHEN an Admin navigates to the assessment results page for a Module, THE LMS SHALL display a list of enrolled Students where each entry shows the Student's full name, total attempt count, and Best_Assessment_Score expressed as a number of correct answers out of the total question count for that Module's Assessment.
2. WHEN no Student has attempted the Assessment for a Module, THE LMS SHALL display a message indicating that no attempts have been recorded, and the Student list SHALL NOT be rendered.
3. THE LMS SHALL sort the Student results list by Best_Assessment_Score in descending order, with Students whose attempt count is zero listed after all Students who have at least one attempt.
4. THE LMS SHALL display the total Assessment_Question count for the Assessment as a fixed value in the page header, independently of the Student results list.
5. IF the Assessment for a Module has fewer than 10 Assessment_Questions, THEN THE LMS SHALL display a warning on the assessment management page indicating the minimum question threshold of 10 has not been met, and the warning SHALL remain visible until the question count reaches 10 or more.
6. IF the assessment results page for a Module fails to load due to a data retrieval error, THEN THE LMS SHALL display an error message indicating the results could not be loaded and SHALL NOT display a partial Student list.

---

### Requirement 8: Assessment Management — Navigation and Access Control

**User Story:** As an Admin, I want a dedicated assessment management page per module accessible from the existing module admin interface, so that authoring fits naturally into the existing admin workflow.

#### Acceptance Criteria

1. THE LMS SHALL expose a page at the route `/admin/modules/[id]/assessment`, consistent with the existing `/admin/modules/[id]/topics` pattern, that renders the module title and an assessment management interface for that module.
2. WHEN an unauthenticated request is made to any `/admin/modules/[id]/assessment` route, THE LMS SHALL redirect the request to `/login`.
3. THE LMS SHALL render a link to `/admin/modules/[id]/assessment` on the module topics page (`/admin/modules/[id]/topics`), in the same section as the page heading or existing per-module navigation controls.
4. WHEN an Admin navigates to `/admin/modules/[id]/assessment` for a Module ID that does not exist in the database, THE LMS SHALL return a 404 response.
5. IF the module ID segment in `/admin/modules/[id]/assessment` is not a valid integer, THEN THE LMS SHALL return a 404 response.

---

### Requirement 9: Assessment Data Integrity

**User Story:** As a system operator, I want assessment data to remain consistent and recoverable, so that student scores are never silently lost or double-counted.

#### Acceptance Criteria

1. THE LMS SHALL enforce a unique constraint on `(student_id, assessment_id, attempt_number)` in the `module_assessment_attempts` table to prevent duplicate attempt records.
2. WHEN an Assessment is deleted by an Admin, THE LMS SHALL cascade-delete all associated Assessment_Questions and Assessment_Attempts for that Assessment, including any attempts with an incomplete status.
3. THE LMS SHALL enforce that `attempt_number` values for a given `(student_id, assessment_id)` pair are always in the range 1 to 2 inclusive, rejecting any insert or update that would produce a value outside that range.
4. THE LMS SHALL store, for each Assessment_Attempt, the student's selected answer for every question presented in that attempt, such that a subsequent read of the attempt record returns the answer for each question without loss.
5. WHEN a Topic is deleted from a Module, THE LMS SHALL NOT automatically delete or alter existing Assessment_Attempts for that Module, so that a subsequent query for those attempts returns the same records and score values that existed before the Topic was deleted.
