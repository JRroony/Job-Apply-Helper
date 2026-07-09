# Local Job Application Autofill

A plain JavaScript Chrome Manifest V3 extension that stores your job application profile locally, fills matching fields on the current page, and records refill actions in a local application tracker. It does not call external APIs and it never submits applications.

## Architecture

The root manifest stays as the Chrome MV3 entry point. Runtime code now lives under `src` and is grouped by responsibility: the service worker coordinates active-tab actions, the content layer reads and fills the current page, the popup owns profile actions, the tracker owns the applications table, and shared helpers hold local storage record logic.

This keeps UI code beside its markup/styles, keeps page-reading logic out of the popup, and gives tracker-related storage rules one shared home.

## Load In Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this extension folder.
5. Open a job application page, click the extension icon, save your profile, then choose `Refill Current Page`.
6. Open `Application Tracker` from the popup to review locally recorded applications.

## Privacy

All profile, resume, and application tracker data is stored with `chrome.storage.local` on your machine. The extension does not send data to any server or external API.

## Manual Review Required

This extension only autofills fields. It never clicks submit, apply, continue, or similar buttons. Review every field before submitting an application manually.

## Application Tracker

When you click `Refill Current Page`, the extension now also tries to record the current application in the local tracker. It extracts the job title, company, application URL, and source from the page, saves the record with status `applied`, and deduplicates by normalized application URL.

You can also click `Record Current Job` if you want to record a page without running autofill again.

The tracker table includes:

- Title
- Company
- Application URL
- Applied At
- Status
- Source
- Notes
- Actions

The tracker supports searching, status filtering, inline status changes, notes, deletion, CSV export, JSON export, and JSON import.

## Autofill Coverage

The content script looks at label text, placeholder, name, id, aria-label, aria-labelledby, autocomplete, and nearby parent text. It supports common text fields, textareas, selects, radios, checkboxes, and native resume file inputs.

It matches common job application fields such as first name, last name, full name, email, phone, location or city, LinkedIn, GitHub, portfolio or website, salary or compensation, work authorization, visa sponsorship, relocation, cover letter, why interested, and additional information.

It can fill a phone country-code dropdown next to a phone input when `phoneCountryCode` is saved in the popup. This is treated separately from residence/current-country questions.

It can also fill voluntary EEO or demographic questions for gender identity, racial or ethnic background, sexual orientation, transgender identity, disability status, and veteran status. These sensitive fields use fixed popup choices, are never inferred, and blank values are skipped.

On page load, autofill skips fields that already appear selected or filled. The `Refill Current Page` button overwrites with the saved local setup values and records the current job in the tracker.

## Limitations

Some applicant tracking systems use custom components that do not behave like native form fields. Fields inside cross-origin iframes may not be accessible to the extension. Closed shadow DOM and heavily scripted upload widgets may also block normal autofill, job-info extraction, or resume attachment. In those cases, fill the missing fields manually and use `Record Current Job` if needed.
