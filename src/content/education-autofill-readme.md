# Education Autofill Notes

This supplemental content script handles Education sections that use custom dropdowns for School, Degree, and Discipline and plain inputs for Start date year and End date year.

It is intentionally separated from the generic autofill script because education sections often use custom searchable dropdowns that need field-specific handling.

Test scenario:

1. Open the extension popup.
2. Save School, Degree, Discipline, Start date year, and End date year.
3. Open an application page with an Education section.
4. Click Refill Current Page.
5. Verify that School, Degree, Discipline, Start date year, and End date year are filled.

Safety:

- It never clicks links.
- It blocks PDF, EEO, policy, privacy, terms, notice, learn-more, and submit/apply/continue/next/review/send/finish clicks.
