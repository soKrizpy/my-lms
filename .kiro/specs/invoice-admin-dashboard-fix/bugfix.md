# Bugfix Requirements Document

## Introduction

The invoice admin dashboard (`/admin/invoices`) exhibits two related failures that together make invoice management non-functional. First, after any action (status change, edit save, or invoice generation), the invoice list does not reflect the updated data — stale data remains on screen. Second, triggering the "Generate Invoice" action produces no visible result: no new invoices appear even when meetings exist for the selected month. Both defects stem from the same underlying condition: the Next.js App Router's default `fetch` caching intercepts requests that are intended to be dynamic, returning stale cached responses instead of live data from the database.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the admin marks an invoice as "Sent" or "Paid" via the status action buttons THEN the system displays the old status in the invoice list instead of the updated status.

1.2 WHEN the admin saves edits (price per meeting or bank account) in the InvoiceModal and the modal closes THEN the system shows the original values in the invoice list instead of the saved values.

1.3 WHEN the admin clicks "Generate Invoice" for a month that has ungenerated invoices and confirms the action THEN the system shows "Berhasil generate N invoice" but the newly generated invoices do not appear in the list.

1.4 WHEN the admin selects a different month in the month picker THEN the system may display a previously cached invoice list for that month rather than the current data from the database.

### Expected Behavior (Correct)

2.1 WHEN the admin marks an invoice as "Sent" or "Paid" THEN the system SHALL immediately reflect the new status in the invoice list after the action completes.

2.2 WHEN the admin saves edits in the InvoiceModal THEN the system SHALL immediately display the updated price and bank account values in the invoice list after the modal closes.

2.3 WHEN the admin clicks "Generate Invoice" and the generation succeeds THEN the system SHALL display the newly generated invoices in the list for the selected month.

2.4 WHEN the admin selects any month THEN the system SHALL fetch and display the current invoice data from the database, bypassing any HTTP cache.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the page first loads THEN the system SHALL CONTINUE TO automatically fetch and display invoices for the previously-selected (default) month.

3.2 WHEN the month picker value changes THEN the system SHALL CONTINUE TO re-fetch and display invoices for the newly selected month.

3.3 WHEN the admin clicks "Generate Invoice" for a month that already has all invoices generated THEN the system SHALL CONTINUE TO report zero new invoices generated without creating duplicates.

3.4 WHEN the admin clicks "Generate Invoice" for a month that has no meeting data THEN the system SHALL CONTINUE TO report zero invoices generated without error.

3.5 WHEN saving an invoice edit THEN the system SHALL CONTINUE TO calculate `total_amount` as `attended_meetings × price_per_meeting` before persisting.

3.6 WHEN the early-month reminder banner is displayed and the admin dismisses it THEN the system SHALL CONTINUE TO hide the banner for the remainder of the session.
