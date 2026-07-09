# Education Autofill Test Scenarios

Use a form with an Education section containing:

- School dropdown
- Degree dropdown
- Discipline dropdown
- Start date year input
- End date year input

Expected result after clicking `Refill Current Page`:

- School is selected from the saved setup value.
- Degree is selected using alias matching, such as Bachelor's Degree matching Bachelor, BS, B.S., or Bachelor of Science.
- Discipline is selected using the saved setup value, such as Computer Science.
- Start date year and End date year are filled as plain year inputs.
- No EEO, policy, privacy, definition, PDF, next, continue, submit, or apply link is clicked.
