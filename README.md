# Local Job Application Autofill

A plain JavaScript Chrome Manifest V3 extension that stores your job application profile locally and fills matching fields on the current page. It does not call external APIs and it never submits applications.

## Files

- `manifest.json`: Chrome MV3 configuration.
- `background.js`: Receives popup fill requests and forwards them to the active tab.
- `popup.html`, `popup.css`, `popup.js`: Profile editor, resume upload, and popup actions.
- `content.js`: Form detection and autofill logic.

## Load In Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this extension folder.
5. Open a job application page, click the extension icon, save your profile, then choose `Refill Current Page`.

## Privacy

All profile and resume data is stored with `chrome.storage.local` on your machine. The extension does not send data to any server or external API.

## Manual Review Required

This extension only autofills fields. It never clicks submit, apply, continue, or similar buttons. Review every field before submitting an application manually.

## Autofill Coverage

The content script looks at label text, placeholder, name, id, aria-label, aria-labelledby, autocomplete, and nearby parent text. It supports common text fields, textareas, selects, radios, checkboxes, and native resume file inputs.

It matches common job application fields such as first name, last name, full name, email, phone, location or city, LinkedIn, GitHub, portfolio or website, salary or compensation, work authorization, visa sponsorship, relocation, cover letter, why interested, and additional information.

It can fill a phone country-code dropdown next to a phone input when `phoneCountryCode` is saved in the popup. This is treated separately from residence/current-country questions.

It can also fill voluntary EEO or demographic questions for gender identity, racial or ethnic background, sexual orientation, transgender identity, disability status, and veteran status. These sensitive fields use fixed popup choices, are never inferred, and blank values are skipped.

On page load, autofill skips fields that already appear selected or filled. The `Refill Current Page` button overwrites with the saved local setup values.

## Limitations

Some applicant tracking systems use custom components that do not behave like native form fields. Fields inside cross-origin iframes may not be accessible to the extension. Closed shadow DOM and heavily scripted upload widgets may also block normal autofill or resume attachment. In those cases, fill the missing fields manually.
