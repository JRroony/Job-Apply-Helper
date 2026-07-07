(() => {
  if (window.__localJobAutofillInstalled) {
    return;
  }

  window.__localJobAutofillInstalled = true;

  const FILL_FORM = "FILL_FORM";

  const PROFILE_KEYS = [
    "firstName",
    "lastName",
    "fullName",
    "email",
    "phone",
    "phoneCountryCode",
    "location",
    "linkedin",
    "github",
    "portfolio",
    "salary",
    "workAuthorization",
    "needSponsorship",
    "relocation",
    "genderIdentity",
    "racialEthnicBackground",
    "sexualOrientation",
    "transgenderIdentity",
    "disabilityStatus",
    "veteranStatus",
    "coverLetter"
  ];

  const YES_NO_KEYS = new Set([
    "workAuthorization",
    "needSponsorship",
    "relocation"
  ]);

  const CONTROLLED_CHOICE_KEYS = new Set([
    "phoneCountryCode",
    "workAuthorization",
    "needSponsorship",
    "veteranStatus"
  ]);

  const EEO_KEYS = new Set([
    "genderIdentity",
    "racialEthnicBackground",
    "sexualOrientation",
    "transgenderIdentity",
    "disabilityStatus",
    "veteranStatus"
  ]);

  const EEO_MULTI_KEYS = new Set([
    "genderIdentity",
    "racialEthnicBackground",
    "sexualOrientation"
  ]);

  const ALIAS_MATCH_KEYS = new Set([
    ...CONTROLLED_CHOICE_KEYS,
    ...EEO_KEYS
  ]);

  const OPTION_ALIASES = {
    phoneCountryCode: {
      "United States (+1)": ["United States", "United States +1", "United States (+1)", "USA", "US", "U.S.", "+1"],
      "Canada (+1)": ["Canada", "Canada +1", "Canada (+1)", "CA", "+1"],
      "China (+86)": ["China", "China +86", "China (+86)", "PRC", "+86"],
      "India (+91)": ["India", "India +91", "India (+91)", "+91"],
      "United Kingdom (+44)": ["United Kingdom", "UK", "Great Britain", "Britain", "+44"],
      "Other": ["Other"]
    },
    workAuthorization: {
      "Yes": ["Yes", "Yes, I am", "Yes, I do"],
      "No": ["No", "No, I am not", "No, I do not"]
    },
    needSponsorship: {
      "Yes": ["Yes", "Yes, I am", "Yes, I do"],
      "No": ["No", "No, I am not", "No, I do not"]
    },
    genderIdentity: {
      "Woman": ["Woman", "Female"],
      "Man": ["Man", "Male"],
      "Non-binary": ["Non-binary", "Nonbinary", "Non binary"],
      "Genderqueer": ["Genderqueer"],
      "Genderfluid": ["Genderfluid", "Gender fluid"],
      "Agender": ["Agender"],
      "Two-Spirit": ["Two-Spirit", "Two Spirit"],
      "Transgender": ["Transgender", "Trans"],
      "Intersex": ["Intersex"],
      "Not listed": ["Not listed", "Not listed above", "Identity not listed", "My identity is not listed"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    racialEthnicBackground: {
      "Asian": ["Asian"],
      "Black or African American": ["Black or African American", "Black", "African American"],
      "Hispanic or Latino/a/x": ["Hispanic or Latino/a/x", "Hispanic", "Latino", "Latina", "Latinx", "Hispanic or Latino"],
      "Middle Eastern or North African": ["Middle Eastern or North African", "Middle Eastern", "North African", "MENA"],
      "Native American or Alaska Native": ["Native American or Alaska Native", "Native American", "American Indian", "Alaska Native", "Indigenous"],
      "Native Hawaiian or Other Pacific Islander": ["Native Hawaiian or Other Pacific Islander", "Native Hawaiian", "Pacific Islander"],
      "White": ["White", "Caucasian"],
      "Two or more races": ["Two or more races", "Multiracial", "Multi racial", "Multiple races"],
      "Not listed": ["Not listed", "Not listed above", "Race not listed", "Ethnicity not listed"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    sexualOrientation: {
      "Straight / Heterosexual": ["Straight / Heterosexual", "Straight", "Heterosexual"],
      "Gay": ["Gay"],
      "Lesbian": ["Lesbian"],
      "Bisexual": ["Bisexual", "Bi"],
      "Pansexual": ["Pansexual", "Pan"],
      "Queer": ["Queer"],
      "Asexual": ["Asexual", "Ace"],
      "Questioning": ["Questioning"],
      "Not listed": ["Not listed", "Not listed above", "Orientation not listed"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    transgenderIdentity: {
      "Yes": ["Yes"],
      "No": ["No"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    disabilityStatus: {
      "Yes, I have a disability or have had one in the past": [
        "Yes, I have a disability or have had one in the past",
        "Yes",
        "Yes, I have a disability",
        "I have a disability",
        "Have had one in the past"
      ],
      "No, I do not have a disability and have not had one in the past": [
        "No, I do not have a disability and have not had one in the past",
        "No",
        "No, I do not have a disability",
        "I do not have a disability"
      ],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    veteranStatus: {
      "Yes": [
        "Yes",
        "I am a veteran",
        "I identify as a protected veteran",
        "I am a protected veteran",
        "Protected veteran",
        "Veteran"
      ],
      "No": [
        "No",
        "I am not a veteran",
        "I am not a protected veteran",
        "Not a veteran",
        "Not protected veteran"
      ],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    }
  };

  const FIELD_PATTERNS = {
    firstName: [
      /\bfirst\s*name\b/i,
      /\bgiven\s*name\b/i,
      /\bpreferred\s*first\s*name\b/i,
      /\bforename\b/i
    ],
    lastName: [
      /\blast\s*name\b/i,
      /\bfamily\s*name\b/i,
      /\bsurname\b/i
    ],
    fullName: [
      /\bfull\s*name\b/i,
      /\blegal\s*name\b/i,
      /\bcomplete\s*name\b/i,
      /\bapplicant\s*name\b/i,
      /\bcandidate\s*name\b/i,
      /\byour\s*name\b/i
    ],
    email: [
      /\be\s*mail\b/i,
      /\bemail\s*address\b/i
    ],
    phone: [
      /phone|phone number|mobile|telephone|tel/i
    ],
    location: [
      /\blocation\b/i,
      /\bcity\b/i,
      /\bcurrent\s*city\b/i,
      /\baddress\b/i,
      /\bwhere\s+.*located\b/i
    ],
    linkedin: [
      /\blinkedin\b/i,
      /\blinked\s*in\b/i
    ],
    github: [
      /\bgithub\b/i,
      /\bgit\s*hub\b/i
    ],
    portfolio: [
      /\bportfolio\b/i,
      /\bpersonal\s*site\b/i,
      /\bpersonal\s*website\b/i,
      /\bwebsite\b/i,
      /\bweb\s*site\b/i,
      /\bhomepage\b/i,
      /\burl\b/i
    ],
    salary: [
      /\bsalary\b/i,
      /\bcompensation\b/i,
      /\bdesired\s*pay\b/i,
      /\bexpected\s*pay\b/i,
      /\bpay\s*range\b/i,
      /\bbase\s*pay\b/i
    ],
    workAuthorization: [
      /authorized to work|legally authorized|work authorization|without restrictions/i
    ],
    needSponsorship: [
      /sponsorship|visa sponsorship|require.*sponsor|need.*sponsor|employment visa status|h-?1b|now or in the future/i
    ],
    relocation: [
      /\brelocat(?:e|ion|ing)\b/i,
      /\bwilling\s*to\s*relocate\b/i,
      /\bopen\s*to\s*relocation\b/i
    ],
    genderIdentity: [
      /gender identity|describe your gender/i
    ],
    racialEthnicBackground: [
      /racial|ethnic|race|ethnicity|racial\/ethnic/i
    ],
    sexualOrientation: [
      /sexual orientation/i
    ],
    transgenderIdentity: [
      /transgender|identify as transgender/i
    ],
    disabilityStatus: [
      /disability|chronic condition|major life activities|physical, visual, auditory, cognitive, mental/i
    ],
    veteranStatus: [
      /veteran|protected veteran|armed forces|military service|active member of the united states armed forces/i
    ],
    coverLetter: [
      /\bcover\s*letter\b/i,
      /\bwhy\s+.*interested\b/i,
      /\bwhy\s+.*role\b/i,
      /\badditional\s*information\b/i,
      /\badditional\s*info\b/i,
      /\btell\s*us\s*about\b/i,
      /\bmessage\b/i,
      /\bcomments?\b/i
    ],
    resume: [
      /\bresume\b/i,
      /\bcv\b/i,
      /\bcurriculum\s*vitae\b/i,
      /\bupload\s+.*(?:resume|cv)\b/i,
      /\battach\s+.*(?:resume|cv)\b/i
    ]
  };

  const MATCH_ORDER = [
    "linkedin",
    "github",
    "portfolio",
    "email",
    "phone",
    "firstName",
    "lastName",
    "salary",
    "genderIdentity",
    "racialEthnicBackground",
    "sexualOrientation",
    "transgenderIdentity",
    "disabilityStatus",
    "veteranStatus",
    "workAuthorization",
    "needSponsorship",
    "relocation",
    "coverLetter",
    "location",
    "fullName"
  ];

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== FILL_FORM) {
      return false;
    }

    fillPage(message.profile || {}, message.resume || null, { overwrite: Boolean(message.overwrite) })
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          filledCount: 0,
          resumeAttached: false,
          error: error && error.message ? error.message : String(error)
        });
      });

    return true;
  });

  queuePageLoadAutofill();

  function queuePageLoadAutofill() {
    window.setTimeout(async () => {
      try {
        const stored = await chrome.storage.local.get(["profile", "resume"]);
        await fillPage(stored.profile || {}, stored.resume || null, { overwrite: false });
      } catch (error) {
        console.warn("Job autofill page-load fill skipped.", error);
      }
    }, 500);
  }

  async function fillPage(profile, resume, options = {}) {
    const overwrite = Boolean(options.overwrite);
    const controls = Array.from(document.querySelectorAll("input, textarea, select"));
    const filledDropdownElements = new Set();
    const filledAliasKeys = new Set();
    const seenRadioGroups = new Set();
    const seenFileInputs = new Set();
    let filledCount = 0;
    let resumeAttached = false;

    if (await fillPhoneCountryCode(profile.phoneCountryCode, { overwrite })) {
      filledCount += 1;
    }

    for (const control of controls) {
      if (!isFillableControl(control)) {
        continue;
      }

      if (isFileInput(control)) {
        if (seenFileInputs.has(control)) {
          continue;
        }

        seenFileInputs.add(control);

        if (!overwrite && control.files && control.files.length > 0) {
          continue;
        }

        if (resume && isResumeField(control) && attachResume(control, resume)) {
          filledCount += 1;
          resumeAttached = true;
        }

        continue;
      }

      const key = detectProfileKey(control);
      const value = getProfileValue(profile, key);

      if (!key || !hasProfileValue(value)) {
        continue;
      }

      if (ALIAS_MATCH_KEYS.has(key) && isDropdownLikeElement(control) && !(control instanceof HTMLSelectElement)) {
        if (!overwrite && dropdownHasExistingSelection(control, key)) {
          continue;
        }

        if (await fillDropdownLikeField(control, value, { overwrite })) {
          filledCount += 1;
          filledDropdownElements.add(control);
          if (ALIAS_MATCH_KEYS.has(key)) {
            filledAliasKeys.add(key);
          }
          continue;
        }
      }

      if (isRadio(control)) {
        const groupKey = getRadioGroupKey(control);

        if (seenRadioGroups.has(groupKey)) {
          continue;
        }

        seenRadioGroups.add(groupKey);

        if (!overwrite && radioGroupHasSelection(control)) {
          continue;
        }

        if (fillRadioGroup(control, key, value)) {
          filledCount += 1;
          if (ALIAS_MATCH_KEYS.has(key)) {
            filledAliasKeys.add(key);
          }
        }

        continue;
      }

      if (isCheckbox(control)) {
        if (!overwrite && (control.checked || (ALIAS_MATCH_KEYS.has(key) && checkboxGroupHasSelection(control)))) {
          continue;
        }

        if (fillCheckbox(control, key, value)) {
          filledCount += 1;
          if (ALIAS_MATCH_KEYS.has(key)) {
            filledAliasKeys.add(key);
          }
        }

        continue;
      }

      if (control instanceof HTMLSelectElement) {
        if (!overwrite && selectHasSelection(control)) {
          continue;
        }

        if (fillSelect(control, key, value)) {
          filledCount += 1;
          if (ALIAS_MATCH_KEYS.has(key)) {
            filledAliasKeys.add(key);
          }
        }

        continue;
      }

      if (ALIAS_MATCH_KEYS.has(key)) {
        continue;
      }

      if (!overwrite && textControlHasValue(control)) {
        continue;
      }

      if (!Array.isArray(value) && fillTextControl(control, value)) {
        filledCount += 1;
      }
    }

    const dropdowns = getDropdownLikeCandidates();

    for (const dropdown of dropdowns) {
      if (filledDropdownElements.has(dropdown)) {
        continue;
      }

      const key = detectProfileKey(dropdown);

      if (!ALIAS_MATCH_KEYS.has(key)) {
        continue;
      }

      if (filledAliasKeys.has(key)) {
        continue;
      }

      const value = getProfileValue(profile, key);

      if (!hasProfileValue(value)) {
        continue;
      }

      if (!overwrite && dropdownHasExistingSelection(dropdown, key)) {
        continue;
      }

      if (await fillDropdownLikeField(dropdown, value, { overwrite })) {
        filledCount += 1;
        filledDropdownElements.add(dropdown);
        filledAliasKeys.add(key);
      }
    }

    return { filledCount, resumeAttached, error: null };
  }

  function isFillableControl(control) {
    if (!control || control.disabled) {
      return false;
    }

    if (control instanceof HTMLInputElement) {
      const type = (control.type || "text").toLowerCase();
      return ![
        "button",
        "color",
        "hidden",
        "image",
        "password",
        "range",
        "reset",
        "submit"
      ].includes(type);
    }

    return control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement;
  }

  function detectProfileKey(control) {
    const autocompleteKey = detectByAutocomplete(control);

    if (autocompleteKey) {
      return autocompleteKey;
    }

    if (control instanceof HTMLInputElement) {
      const type = (control.type || "").toLowerCase();

      if (type === "email") {
        return "email";
      }

      if (type === "tel") {
        return "phone";
      }
    }

    const text = getFieldText(control);

    for (const key of MATCH_ORDER) {
      if (key !== "fullName" && matchesAny(text, FIELD_PATTERNS[key])) {
        return key;
      }
    }

    if (matchesAny(text, FIELD_PATTERNS.fullName)) {
      return "fullName";
    }

    if (/\bname\b/i.test(text) && !matchesAny(text, FIELD_PATTERNS.firstName) && !matchesAny(text, FIELD_PATTERNS.lastName)) {
      return "fullName";
    }

    return null;
  }

  function detectByAutocomplete(control) {
    const autocomplete = normalizeText(control.getAttribute("autocomplete") || "");

    if (!autocomplete) {
      return null;
    }

    if (/\bgiven\s*name\b/i.test(autocomplete)) {
      return "firstName";
    }

    if (/\bfamily\s*name\b/i.test(autocomplete)) {
      return "lastName";
    }

    if (/\bname\b/i.test(autocomplete)) {
      return "fullName";
    }

    if (/\bemail\b/i.test(autocomplete)) {
      return "email";
    }

    if (/\btel\b|\bphone\b/i.test(autocomplete)) {
      return "phone";
    }

    if (/\baddress\s*level\s*2\b|\bcity\b/i.test(autocomplete)) {
      return "location";
    }

    if (/\burl\b/i.test(autocomplete)) {
      return "portfolio";
    }

    return null;
  }

  function getProfileValue(profile, key) {
    if (!key || !PROFILE_KEYS.includes(key)) {
      return "";
    }

    if (key === "fullName") {
      return trimValue(profile.fullName) || [profile.firstName, profile.lastName].map(trimValue).filter(Boolean).join(" ");
    }

    if (EEO_MULTI_KEYS.has(key) && Array.isArray(profile[key])) {
      return profile[key].map(trimValue).filter(Boolean);
    }

    if (Array.isArray(profile[key])) {
      return profile[key].map(trimValue).filter(Boolean).join(", ");
    }

    return trimValue(profile[key]);
  }

  function hasProfileValue(value) {
    if (Array.isArray(value)) {
      return value.some((item) => trimValue(item));
    }

    return Boolean(trimValue(value));
  }

  function normalizeProfileValues(value) {
    if (Array.isArray(value)) {
      return value.map(trimValue).filter(Boolean);
    }

    const text = trimValue(value);
    return text ? [text] : [];
  }

  async function fillPhoneCountryCode(value, options = {}) {
    const savedValue = trimValue(value);
    const overwrite = Boolean(options.overwrite);

    if (!savedValue) {
      return false;
    }

    const phoneInput = findPhoneInput();

    if (!phoneInput) {
      return false;
    }

    const dropdown = findPhoneCountryDropdown(phoneInput);

    if (!dropdown) {
      console.warn("No phone country code dropdown found near the phone input.");
      return false;
    }

    if (dropdown instanceof HTMLSelectElement) {
      if (!overwrite && selectHasSelection(dropdown)) {
        return false;
      }

      if (fillSelect(dropdown, "phoneCountryCode", savedValue)) {
        return true;
      }

      console.warn("No matching phone country code option found.", { value: savedValue });
      return false;
    }

    if (!overwrite && dropdownHasExistingSelection(dropdown, "phoneCountryCode")) {
      return false;
    }

    if (await fillDropdownLikeField(dropdown, savedValue, { overwrite, key: "phoneCountryCode" })) {
      return true;
    }

    console.warn("No matching phone country code option found.", { value: savedValue });
    return false;
  }

  function findPhoneInput() {
    const controls = Array.from(document.querySelectorAll("input, textarea"));

    return controls.find((control) => {
      return isFillableControl(control) && isPhoneInput(control);
    }) || null;
  }

  function isPhoneInput(control) {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
      return false;
    }

    const type = control instanceof HTMLInputElement ? (control.type || "").toLowerCase() : "";

    if (type === "tel") {
      return true;
    }

    const text = getFieldText(control);
    return /phone|phone number|mobile|telephone|tel/i.test(text);
  }

  function findPhoneCountryDropdown(phoneInput) {
    const rowCandidate = findPhoneCountryDropdownInNearbyContainers(phoneInput);

    if (rowCandidate) {
      return rowCandidate;
    }

    return findPhoneCountryDropdownByLabel(phoneInput);
  }

  function findPhoneCountryDropdownInNearbyContainers(phoneInput) {
    const phoneRect = phoneInput.getBoundingClientRect();
    const candidates = [];
    let container = phoneInput.parentElement;
    let depth = 1;

    while (container && depth <= 4) {
      getPhoneCountryDropdownCandidates(container).forEach((candidate) => {
        if (candidate === phoneInput || candidate.contains(phoneInput)) {
          return;
        }

        if (!isPhoneCountryCandidateNearInput(candidate, phoneRect)) {
          return;
        }

        const context = getPhoneCountryCandidateContext(candidate);

        if (isResidenceCountryText(context)) {
          return;
        }

        candidates.push({
          element: candidate,
          score: scorePhoneCountryCandidate(candidate, phoneRect, context, depth)
        });
      });

      container = container.parentElement;
      depth += 1;
    }

    candidates.sort((first, second) => first.score - second.score);
    return candidates.length ? candidates[0].element : null;
  }

  function findPhoneCountryDropdownByLabel(phoneInput) {
    const phoneRect = phoneInput.getBoundingClientRect();
    const labels = Array.from(document.querySelectorAll("label"));
    const candidates = [];

    labels.forEach((label) => {
      const text = normalizeText(visibleText(label, 120));

      if (!isMostlyCountryLabel(text) || isResidenceCountryText(text)) {
        return;
      }

      const control = label.control || findDropdownInsideOrNearLabel(label);

      if (!control || !isPhoneCountryDropdownCandidate(control)) {
        return;
      }

      if (!isPhoneCountryCandidateNearInput(control, phoneRect)) {
        return;
      }

      candidates.push({
        element: control,
        score: scorePhoneCountryCandidate(control, phoneRect, text, 5)
      });
    });

    candidates.sort((first, second) => first.score - second.score);
    return candidates.length ? candidates[0].element : null;
  }

  function findDropdownInsideOrNearLabel(label) {
    const forId = label.getAttribute("for");

    if (forId) {
      const control = document.getElementById(forId);

      if (control) {
        return control;
      }
    }

    const inside = label.querySelector("select, [role='combobox'], [aria-haspopup], [aria-expanded], button, div, span");

    if (inside) {
      return inside;
    }

    const parent = label.parentElement;

    if (!parent) {
      return null;
    }

    return Array.from(parent.querySelectorAll("select, [role='combobox'], [aria-haspopup], [aria-expanded], button, div, span"))
      .find((candidate) => candidate !== label && isPhoneCountryDropdownCandidate(candidate)) || null;
  }

  function getPhoneCountryDropdownCandidates(container) {
    const selector = [
      "select",
      "[role='combobox']",
      "[aria-haspopup]",
      "[aria-expanded]",
      "button",
      "div",
      "span"
    ].join(",");

    return Array.from(container.querySelectorAll(selector)).filter(isPhoneCountryDropdownCandidate);
  }

  function isPhoneCountryDropdownCandidate(element) {
    if (!element || !(element instanceof Element) || !isVisibleElement(element) || isForbiddenActionElement(element)) {
      return false;
    }

    if (element instanceof HTMLSelectElement) {
      return true;
    }

    if (element.matches("[role='combobox'], [aria-haspopup], [aria-expanded], button")) {
      return true;
    }

    if (looksLikeDropdownByAttributes(element) && isClickableElement(element)) {
      return true;
    }

    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (element.tagName !== "DIV" && element.tagName !== "SPAN") {
      return false;
    }

    return isClickableElement(element) || hasDropdownCue(element);
  }

  function isPhoneCountryCandidateNearInput(candidate, phoneRect) {
    const rect = candidate.getBoundingClientRect();

    if (!rect.width || !rect.height || !phoneRect.width || !phoneRect.height) {
      return false;
    }

    const candidateCenterY = rect.top + rect.height / 2;
    const phoneCenterY = phoneRect.top + phoneRect.height / 2;
    const isBeforePhone = rect.right <= phoneRect.left + 20 || rect.left < phoneRect.left;
    const isSameRow = Math.abs(candidateCenterY - phoneCenterY) < 80;
    const isNarrower = rect.width < phoneRect.width;

    return isBeforePhone && isSameRow && isNarrower;
  }

  function scorePhoneCountryCandidate(candidate, phoneRect, context, depth) {
    const rect = candidate.getBoundingClientRect();
    const verticalDistance = Math.abs((rect.top + rect.height / 2) - (phoneRect.top + phoneRect.height / 2));
    const horizontalDistance = Math.abs(phoneRect.left - rect.right);
    let score = depth * 100 + verticalDistance + horizontalDistance / 10;

    if (isPhoneCountryContextText(context)) {
      score -= 250;
    } else if (!trimValue(context)) {
      score -= 75;
    } else {
      score += 75;
    }

    return score;
  }

  function getPhoneCountryCandidateContext(candidate) {
    const parts = [];

    addPart(parts, getAttributeText(candidate, "aria-label"));
    addPart(parts, getAttributeText(candidate, "name"));
    addPart(parts, getAttributeText(candidate, "id"));
    addPart(parts, getAttributeText(candidate, "placeholder"));
    addPart(parts, getAriaLabelledByText(candidate));
    addPart(parts, getLabelText(candidate));

    const parent = candidate.parentElement;

    if (parent) {
      addPart(parts, nearbyContainerText(parent, candidate, 140));
    }

    return normalizeText(parts.join(" "));
  }

  function isPhoneCountryContextText(text) {
    return /\b(country|country code|phone country|phone country code)\b/i.test(text) && !isResidenceCountryText(text);
  }

  function isMostlyCountryLabel(text) {
    return /^(country|country code|phone country|phone country code)$/i.test(text) ||
      /\bcountry\b/i.test(text) && !/\b(residence|current|address|citizenship|nationality)\b/i.test(text);
  }

  function isResidenceCountryText(text) {
    return /\bcountry of residence\b|\bresidence country\b|\bcurrent country\b/i.test(text);
  }

  function hasDropdownCue(element) {
    const text = visibleText(element, 80);

    return /\bselect\b|[▾▿▼⌄⌃⌵∨]/i.test(text);
  }

  function textControlHasValue(control) {
    return Boolean(trimValue(control.value));
  }

  function selectHasSelection(select) {
    if (select.multiple) {
      return Array.from(select.selectedOptions).some((option) => trimValue(option.value) || trimValue(option.textContent));
    }

    const option = select.selectedOptions && select.selectedOptions[0];
    return Boolean(trimValue(select.value) || (option && trimValue(option.textContent) && option.index > 0));
  }

  function radioGroupHasSelection(radio) {
    return getRadioGroup(radio).some((item) => item.checked);
  }

  function checkboxGroupHasSelection(checkbox) {
    const name = checkbox.getAttribute("name");
    const root = checkbox.form || document;

    if (name) {
      return Array.from(root.querySelectorAll(`input[type="checkbox"][name="${cssEscape(name)}"]`)).some((item) => item.checked);
    }

    const fieldset = checkbox.closest("fieldset");

    if (fieldset) {
      return Array.from(fieldset.querySelectorAll("input[type='checkbox']")).some((item) => item.checked);
    }

    return checkbox.checked;
  }

  function dropdownHasExistingSelection(element, key) {
    const attributeValues = [
      typeof element.value === "string" ? element.value : "",
      element.getAttribute("aria-valuetext") || "",
      element.getAttribute("data-value") || ""
    ];
    const visibleValue = visibleText(element, 160);

    if (element.querySelector("[aria-selected='true'], [data-selected='true'], .selected")) {
      return true;
    }

    if (attributeValues.some((value) => {
      return getKnownOptionValues(key).some((option) => aliasTextMatchesSavedValue(value, key, option, false));
    })) {
      return true;
    }

    if (!visibleValue || isPlaceholderDropdownText(visibleValue)) {
      return false;
    }

    if (getKnownOptionValues(key).some((option) => aliasTextMatchesSavedValue(visibleValue, key, option, true))) {
      return true;
    }

    if (matchesAny(normalizeText(visibleValue), FIELD_PATTERNS[key] || [])) {
      return false;
    }

    return getKnownOptionValues(key).some((option) => aliasTextMatchesSavedValue(visibleValue, key, option, false));
  }

  function getKnownOptionValues(key) {
    return Object.keys(OPTION_ALIASES[key] || {});
  }

  function isPlaceholderDropdownText(value) {
    const text = normalizeText(value);
    return /^(select|select one|select option|select an option|choose|choose one|please select|please choose)$/i.test(text);
  }

  function fillTextControl(control, value) {
    if (control.readOnly) {
      return false;
    }

    setNativeValue(control, value);
    dispatchInputAndChange(control);
    return true;
  }

  function fillSelect(select, key, value) {
    const values = normalizeProfileValues(value);
    const options = Array.from(select.options);
    let selectedCount = 0;

    if (!values.length || !options.length) {
      return false;
    }

    values.forEach((item) => {
      let option = ALIAS_MATCH_KEYS.has(key) ? findAliasOption(options, key, item) : findOption(options, item);

      if (!option && YES_NO_KEYS.has(key)) {
        option = findYesNoOption(options, item);
      }

      if (!option) {
        return;
      }

      if (select.multiple) {
        option.selected = true;
        selectedCount += 1;
      } else if (selectedCount === 0) {
        setNativeValue(select, option.value);
        option.selected = true;
        selectedCount += 1;
      }
    });

    if (selectedCount === 0) {
      return false;
    }

    dispatchInputAndChange(select);
    return true;
  }

  function fillRadioGroup(radio, key, value) {
    const radios = getRadioGroup(radio);
    let target = null;
    const values = normalizeProfileValues(value);

    values.some((item) => {
      if (ALIAS_MATCH_KEYS.has(key)) {
        target = radios.find((radioOption) => optionMatchesAliasValue(radioOption, key, item));
      }

      if (!target && YES_NO_KEYS.has(key)) {
        target = radios.find((radioOption) => optionMatchesYesNo(radioOption, item));
      }

      if (!target) {
        target = radios.find((radioOption) => optionMatchesText(radioOption, item));
      }

      return Boolean(target);
    });

    if (!target || target.disabled) {
      return false;
    }

    setNativeChecked(target, true);
    dispatchInputAndChange(target);
    return target.checked;
  }

  function fillCheckbox(checkbox, key, value) {
    if (ALIAS_MATCH_KEYS.has(key)) {
      const matchesSavedValue = normalizeProfileValues(value).some((item) => {
        return optionMatchesAliasValue(checkbox, key, item);
      });

      if (!matchesSavedValue) {
        return false;
      }

      setNativeChecked(checkbox, true);
      dispatchInputAndChange(checkbox);
      return checkbox.checked;
    }

    if (!YES_NO_KEYS.has(key)) {
      return false;
    }

    const yesNo = parseYesNo(value);

    if (yesNo === null) {
      return false;
    }

    const text = getFieldText(checkbox);
    const desired = shouldInvertCheckboxMeaning(key, text) ? !yesNo : yesNo;

    setNativeChecked(checkbox, desired);
    dispatchInputAndChange(checkbox);
    return checkbox.checked === desired;
  }

  async function fillDropdownLikeField(element, value, options = {}) {
    if (!element || !(element instanceof Element)) {
      return false;
    }

    const values = normalizeProfileValues(value);
    const key = options.key || detectProfileKey(element);
    const clickable = findClickableDropdownElement(element, key);
    const overwrite = Boolean(options.overwrite);
    let selectedCount = 0;

    if (!values.length || !clickable || !ALIAS_MATCH_KEYS.has(key)) {
      return false;
    }

    if (!overwrite && dropdownHasExistingSelection(clickable, key)) {
      return false;
    }

    for (const item of values) {
      openDropdown(clickable);
      await wait(180);

      const option = findMatchingVisibleOption(item, key);

      if (!option) {
        console.warn("No matching autofill dropdown option found.", { field: key });
        continue;
      }

      clickElement(option);
      selectedCount += 1;
      dispatchInputAndChange(clickable);

      if (element !== clickable) {
        dispatchInputAndChange(element);
      }

      await wait(120);
    }

    if (selectedCount > 0) {
      closeDropdown(clickable);
    }

    return selectedCount > 0;
  }

  function getDropdownLikeCandidates() {
    const selector = [
      "[role]",
      "[aria-haspopup]",
      "[aria-expanded]",
      "[tabindex]",
      "[class]",
      "[id]",
      "[data-testid]",
      "[data-test]",
      "[data-qa]",
      "button"
    ].join(",");

    return Array.from(document.querySelectorAll(selector)).filter((element) => {
      return !element.matches("input, textarea, select, option") &&
        isVisibleElement(element) &&
        (isDropdownLikeElement(element) || isLikelyAliasDropdownTrigger(element));
    });
  }

  function findClickableDropdownElement(element, key) {
    if (!element || !(element instanceof Element)) {
      return null;
    }

    if (isVisibleElement(element) && isClickableDropdownElement(element, key)) {
      return element;
    }

    const closest = element.closest("[role='combobox'], [role='listbox'], [aria-haspopup], [aria-expanded], button, [role='button'], [tabindex]");

    if (closest && isVisibleElement(closest) && isClickableDropdownElement(closest, key)) {
      return closest;
    }

    let current = element.parentElement;
    let depth = 0;

    while (current && depth < 4) {
      const candidate = Array.from(current.querySelectorAll("[role], [aria-haspopup], [aria-expanded], [tabindex], button, [class], [id]"))
        .find((item) => isVisibleElement(item) && isClickableDropdownElement(item, key));

      if (candidate) {
        return candidate;
      }

      current = current.parentElement;
      depth += 1;
    }

    return null;
  }

  function isClickableDropdownElement(element, key) {
    if (isDropdownLikeElement(element) || isLikelyAliasDropdownTrigger(element)) {
      return true;
    }

    return key === "phoneCountryCode" && isPhoneCountryDropdownCandidate(element);
  }

  function isDropdownLikeElement(element) {
    if (!element || element.disabled || element.getAttribute("aria-disabled") === "true") {
      return false;
    }

    if (isForbiddenActionElement(element)) {
      return false;
    }

    const role = normalizeText(element.getAttribute("role") || "");

    if (role === "combobox" || role === "listbox") {
      return true;
    }

    if (element.hasAttribute("aria-haspopup") || element.hasAttribute("aria-expanded")) {
      return true;
    }

    if (looksLikeDropdownByAttributes(element) && isClickableElement(element)) {
      return true;
    }

    if (element.tagName === "BUTTON") {
      return looksLikeDropdownByAttributes(element) || /\b(select|choose|dropdown)\b/i.test(visibleText(element, 80));
    }

    return false;
  }

  function isLikelyAliasDropdownTrigger(element) {
    const role = normalizeText(element.getAttribute("role") || "");

    return !isForbiddenActionElement(element) &&
      isClickableElement(element) &&
      (element.tagName === "BUTTON" || role === "button" || element.hasAttribute("tabindex") || getComputedStyle(element).cursor === "pointer") &&
      ALIAS_MATCH_KEYS.has(detectProfileKey(element));
  }

  function isForbiddenActionElement(element) {
    const type = normalizeText(element.getAttribute("type") || "");
    const text = normalizeText([
      visibleText(element, 100),
      element.getAttribute("aria-label") || "",
      element.getAttribute("title") || ""
    ].join(" "));

    return type === "submit" ||
      /\b(submit|apply|continue|next|save|finish|review|send)\b/i.test(text);
  }

  function looksLikeDropdownByAttributes(element) {
    const text = normalizeText([
      element.id || "",
      element.className || "",
      element.getAttribute("name") || "",
      element.getAttribute("data-testid") || "",
      element.getAttribute("data-test") || "",
      element.getAttribute("data-qa") || ""
    ].join(" "));

    return /\b(dropdown|drop down|select|combobox|combo box|listbox|list box|multiselect|multi select|chosen)\b/i.test(text);
  }

  function isClickableElement(element) {
    if (element.tagName === "BUTTON" || element.tagName === "A") {
      return true;
    }

    if (element.getAttribute("role") === "button") {
      return true;
    }

    if (element.hasAttribute("tabindex")) {
      return true;
    }

    return getComputedStyle(element).cursor === "pointer";
  }

  function openDropdown(element) {
    if (typeof element.focus === "function") {
      element.focus();
    }

    clickElement(element);
  }

  function closeDropdown(element) {
    const options = { bubbles: true, cancelable: true, key: "Escape", code: "Escape" };

    element.dispatchEvent(new KeyboardEvent("keydown", options));
    document.dispatchEvent(new KeyboardEvent("keydown", options));
    element.dispatchEvent(new KeyboardEvent("keyup", options));
    document.dispatchEvent(new KeyboardEvent("keyup", options));

    if (typeof element.blur === "function") {
      element.blur();
    }
  }

  function findMatchingVisibleOption(value, key) {
    const desired = normalizeText(value);
    const options = getVisibleOptionCandidates();
    const exactMatch = options.find((option) => {
      return getOptionTextCandidates(option).some((text) => {
        return ALIAS_MATCH_KEYS.has(key) ? aliasTextMatchesSavedValue(text, key, value, true) : normalizeText(text) === desired;
      });
    });

    if (exactMatch) {
      return exactMatch;
    }

    return options.find((option) => {
      return getOptionTextCandidates(option).some((text) => {
        return ALIAS_MATCH_KEYS.has(key) ? aliasTextMatchesSavedValue(text, key, value, false) : textIncludesMatch(normalizeText(text), desired);
      });
    }) || null;
  }

  function getVisibleOptionCandidates() {
    const selector = [
      "[role='option']",
      "[role='menuitem']",
      "[role='treeitem']",
      "[aria-selected]",
      "[data-value]",
      "li",
      "button",
      "div",
      "span",
      "[class]",
      "[id]"
    ].join(",");

    const candidates = Array.from(document.querySelectorAll(selector)).filter((element) => {
      const text = getOptionText(element);

      return text &&
        text.length <= 240 &&
        isVisibleElement(element) &&
        !element.matches("input, textarea, select, option") &&
        isOptionLikeElement(element);
    });

    return candidates.filter((element) => {
      return !candidates.some((other) => other !== element && element.contains(other));
    });
  }

  function isOptionLikeElement(element) {
    const role = normalizeText(element.getAttribute("role") || "");
    const parentRole = normalizeText(element.parentElement ? element.parentElement.getAttribute("role") || "" : "");

    if (role === "option" || role === "menuitem" || role === "treeitem") {
      return true;
    }

    if (parentRole === "listbox" || parentRole === "menu" || parentRole === "tree") {
      return true;
    }

    if (element.hasAttribute("aria-selected") || element.hasAttribute("data-value")) {
      return true;
    }

    if (element.tagName === "LI") {
      return true;
    }

    const attributeText = normalizeText([
      element.id || "",
      element.className || "",
      element.getAttribute("data-testid") || "",
      element.getAttribute("data-test") || "",
      element.getAttribute("data-qa") || ""
    ].join(" "));

    if (/\b(option|choice)\b/i.test(attributeText)) {
      return true;
    }

    if (/\b(item|menu)\b/i.test(attributeText)) {
      return hasOptionContainerAncestor(element);
    }

    return false;
  }

  function hasOptionContainerAncestor(element) {
    let current = element.parentElement;
    let depth = 0;

    while (current && depth < 4) {
      const role = normalizeText(current.getAttribute("role") || "");
      const attributeText = normalizeText([
        current.id || "",
        current.className || "",
        current.getAttribute("data-testid") || "",
        current.getAttribute("data-test") || "",
        current.getAttribute("data-qa") || ""
      ].join(" "));

      if (role === "listbox" || role === "menu" || /\b(menu|listbox|options|dropdown)\b/i.test(attributeText)) {
        return true;
      }

      current = current.parentElement;
      depth += 1;
    }

    return false;
  }

  function getOptionText(element) {
    return limitText(getOptionTextCandidates(element).join(" "), 240);
  }

  function getOptionTextCandidates(element) {
    const values = [
      visibleText(element, 240),
      typeof element.value === "string" ? element.value : "",
      element.getAttribute("aria-label") || "",
      element.getAttribute("data-value") || "",
      element.getAttribute("title") || ""
    ];

    if (element instanceof HTMLInputElement) {
      values.push(getLabelText(element));
    }

    return uniqueValues(values);
  }

  function clickElement(element) {
    if (typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ block: "center", inline: "nearest" });
    }

    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    element.click();
  }

  function isVisibleElement(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0;
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function attachResume(input, resume) {
    if (!resume || !resume.dataUrl || !input || input.disabled) {
      return false;
    }

    try {
      const file = dataUrlToFile(resume.dataUrl, resume.name || "resume", resume.type || "application/octet-stream");
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      dispatchInputAndChange(input);
      return input.files && input.files.length > 0;
    } catch (_error) {
      return false;
    }
  }

  function isResumeField(input) {
    const text = getFieldText(input);

    if (matchesAny(text, FIELD_PATTERNS.resume)) {
      return true;
    }

    const accept = normalizeText(input.getAttribute("accept") || "");
    return /\bpdf\b|\bdocx?\b|\bmsword\b|\bwordprocessingml\b/i.test(accept) && !/\bcover\s*letter\b/i.test(text);
  }

  function isFileInput(control) {
    return control instanceof HTMLInputElement && (control.type || "").toLowerCase() === "file";
  }

  function isRadio(control) {
    return control instanceof HTMLInputElement && (control.type || "").toLowerCase() === "radio";
  }

  function isCheckbox(control) {
    return control instanceof HTMLInputElement && (control.type || "").toLowerCase() === "checkbox";
  }

  function getRadioGroup(radio) {
    const form = radio.form || document;
    const name = radio.getAttribute("name");

    if (!name) {
      return [radio];
    }

    return Array.from(form.querySelectorAll(`input[type="radio"][name="${cssEscape(name)}"]`));
  }

  function getRadioGroupKey(radio) {
    const formId = radio.form ? radio.form.id || radio.form.name || "form" : "document";
    return `${formId}:${radio.name || getFieldText(radio)}`;
  }

  function getFieldText(control) {
    const parts = [];

    addPart(parts, getAttributeText(control, "aria-label"));
    addPart(parts, getAttributeText(control, "placeholder"));
    addPart(parts, getAttributeText(control, "name"));
    addPart(parts, getAttributeText(control, "id"));
    addPart(parts, getAttributeText(control, "autocomplete"));
    addPart(parts, getAttributeText(control, "title"));
    addPart(parts, getAttributeText(control, "data-testid"));
    addPart(parts, getAttributeText(control, "data-test"));
    addPart(parts, getAttributeText(control, "data-qa"));
    addPart(parts, getAriaLabelledByText(control));
    addPart(parts, getLabelText(control));
    addPart(parts, getNearbyText(control));

    return normalizeText(parts.join(" "));
  }

  function getAttributeText(element, name) {
    return element.getAttribute(name) || "";
  }

  function getAriaLabelledByText(element) {
    const ids = (element.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean);
    return ids.map((id) => {
      const target = document.getElementById(id);
      return target ? visibleText(target) : "";
    }).join(" ");
  }

  function getLabelText(control) {
    const parts = [];

    if (control.labels) {
      Array.from(control.labels).forEach((label) => addPart(parts, visibleText(label)));
    }

    const id = control.getAttribute("id");

    if (id) {
      document.querySelectorAll(`label[for="${cssEscape(id)}"]`).forEach((label) => {
        addPart(parts, visibleText(label));
      });
    }

    const wrappingLabel = control.closest("label");

    if (wrappingLabel) {
      addPart(parts, visibleText(wrappingLabel));
    }

    return parts.join(" ");
  }

  function getNearbyText(control) {
    const parts = [];
    const previous = control.previousElementSibling;

    if (previous) {
      addPart(parts, visibleText(previous, 180));
    }

    if (control.parentElement && control.parentElement.previousElementSibling) {
      addPart(parts, visibleText(control.parentElement.previousElementSibling, 180));
    }

    let current = control.parentElement;
    let depth = 0;

    while (current && depth < 3) {
      const legend = current.querySelector(":scope > legend");

      if (legend) {
        addPart(parts, visibleText(legend, 180));
      }

      addPart(parts, nearbyContainerText(current, control, 260));
      current = current.parentElement;
      depth += 1;
    }

    return parts.join(" ");
  }

  function nearbyContainerText(element, control, limit) {
    const parts = [];

    Array.from(element.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        addPart(parts, node.textContent || "");
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const child = node;

      if (child === control || child.contains(control)) {
        addPart(parts, textWithoutControls(child, 180));
        return;
      }

      if (child.matches("input, textarea, select, button, script, style")) {
        return;
      }

      if (child.querySelector("input, textarea, select")) {
        return;
      }

      addPart(parts, visibleText(child, 180));
    });

    return limitText(parts.join(" "), limit);
  }

  function textWithoutControls(element, limit) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("input, textarea, select, button, script, style").forEach((child) => child.remove());
    return limitText(clone.textContent || "", limit);
  }

  function visibleText(element, limit = 240) {
    return limitText(element.innerText || element.textContent || "", limit);
  }

  function addPart(parts, value) {
    const text = trimValue(value);

    if (text) {
      parts.push(text);
    }
  }

  function matchesAny(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }

  function findAliasOption(options, key, value) {
    const exactMatch = options.find((option) => {
      return getOptionTextCandidates(option).some((text) => aliasTextMatchesSavedValue(text, key, value, true));
    });

    if (exactMatch) {
      return exactMatch;
    }

    return options.find((option) => {
      return getOptionTextCandidates(option).some((text) => aliasTextMatchesSavedValue(text, key, value, false));
    }) || null;
  }

  function optionMatchesAliasValue(option, key, value) {
    return getOptionTextCandidates(option).some((text) => aliasTextMatchesSavedValue(text, key, value, false));
  }

  function aliasTextMatchesSavedValue(optionText, key, value, exactOnly) {
    const option = normalizeText(optionText);
    const aliases = getOptionAliases(key, value);

    if (!option || !aliases.length) {
      return false;
    }

    if (aliases.some((alias) => option === normalizeText(alias))) {
      return true;
    }

    if (exactOnly) {
      return false;
    }

    if (isContradictoryAliasMatch(key, value, option)) {
      return false;
    }

    return aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return aliasIncludesMatch(option, normalizedAlias, key);
    });
  }

  function isContradictoryAliasMatch(key, value, option) {
    const savedValue = normalizeText(value);

    if (key === "veteranStatus" && savedValue === "yes") {
      return /\b(no|not|decline|prefer)\b/i.test(option);
    }

    return false;
  }

  function aliasIncludesMatch(option, alias, key) {
    if (!option || !alias) {
      return false;
    }

    if (key === "phoneCountryCode" && /^\+\d+$/.test(alias)) {
      return option === alias;
    }

    if (/^[a-z0-9]+$/i.test(alias)) {
      return new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(option);
    }

    return option.includes(alias);
  }

  function getOptionAliases(key, value) {
    const savedValue = trimValue(value);
    const aliases = [savedValue];
    const fieldAliases = OPTION_ALIASES[key] || {};

    if (fieldAliases[savedValue]) {
      aliases.push(...fieldAliases[savedValue]);
    }

    if (savedValue === "Prefer not to answer") {
      aliases.push(...getPreferNotToAnswerAliases());
    }

    return uniqueValues(aliases);
  }

  function getPreferNotToAnswerAliases() {
    return [
      "Prefer not to answer",
      "I don't wish to answer",
      "I do not wish to answer",
      "Do not wish to answer",
      "Decline",
      "Decline to answer",
      "Decline to self-identify",
      "Decline to self identify",
      "Decline to state",
      "I don't want to answer",
      "I do not want to answer"
    ];
  }

  function findOption(options, value) {
    const desired = normalizeText(value);

    const exactTextMatch = options.find((option) => {
      const optionText = normalizeText(option.textContent);
      return optionText && optionText === desired;
    });

    if (exactTextMatch) {
      return exactTextMatch;
    }

    const exactValueMatch = options.find((option) => {
      const optionValue = normalizeText(option.value);
      return optionValue && optionValue === desired;
    });

    if (exactValueMatch) {
      return exactValueMatch;
    }

    return options.find((option) => {
      const optionValue = normalizeText(option.value);
      const optionText = normalizeText(option.textContent);

      if (!optionValue && !optionText) {
        return false;
      }

      return textIncludesMatch(optionValue, desired) || textIncludesMatch(optionText, desired);
    }) || null;
  }

  function findYesNoOption(options, value) {
    return options.find((option) => optionMatchesYesNo(option, value)) || null;
  }

  function optionMatchesYesNo(option, value) {
    const desired = parseYesNo(value);

    if (desired === null) {
      return false;
    }

    const text = getOptionComparableText(option);
    const optionValue = parseYesNo(text);

    return optionValue === desired;
  }

  function optionMatchesText(option, value) {
    const desired = normalizeText(value);
    const text = getOptionComparableText(option);

    return text === desired || textIncludesMatch(text, desired);
  }

  function textIncludesMatch(text, desired) {
    if (!text || !desired) {
      return false;
    }

    if (desired.length <= 2) {
      return new RegExp(`\\b${escapeRegExp(desired)}\\b`, "i").test(text);
    }

    return text.includes(desired) || desired.includes(text);
  }

  function getOptionComparableText(option) {
    if (option instanceof HTMLInputElement) {
      return normalizeText([
        option.value,
        option.getAttribute("aria-label") || "",
        getLabelText(option)
      ].join(" "));
    }

    return normalizeText([
      option.value || "",
      option.textContent || ""
    ].join(" "));
  }

  function parseYesNo(value) {
    const text = normalizeText(value);

    if (!text) {
      return null;
    }

    if (/^(no|n|false|0)$/i.test(text) || /\bno\b|\bnot\b|\bdo not\b|\bdon t\b|\bunable\b|\bunwilling\b/i.test(text)) {
      return false;
    }

    if (/^(yes|y|true|1)$/i.test(text) || /\byes\b|\bi am\b|\bi can\b|\bi will\b|\bauthorized\b|\beligible\b|\bwilling\b|\bopen\b/i.test(text)) {
      return true;
    }

    return null;
  }

  function shouldInvertCheckboxMeaning(key, text) {
    if (key === "needSponsorship") {
      return /\b(do\s*not|don\s*t|no|not|without)\b.{0,40}\bsponsor/i.test(text) ||
        /\bsponsor.{0,40}\b(not|required\s*not|not\s*required)\b/i.test(text);
    }

    if (key === "workAuthorization") {
      return /\bnot\b.{0,40}\bauthori[sz]ed\b/i.test(text) ||
        /\bnot\b.{0,40}\beligible\b/i.test(text);
    }

    if (key === "relocation") {
      return /\bnot\b.{0,40}\brelocat/i.test(text) ||
        /\bunwilling\b.{0,40}\brelocat/i.test(text);
    }

    return false;
  }

  function setNativeValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const prototypeDescriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    const ownDescriptor = Object.getOwnPropertyDescriptor(element, "value");

    if (prototypeDescriptor && prototypeDescriptor.set && (!ownDescriptor || ownDescriptor.set !== prototypeDescriptor.set)) {
      prototypeDescriptor.set.call(element, value);
      return;
    }

    element.value = value;
  }

  function setNativeChecked(element, checked) {
    const prototype = Object.getPrototypeOf(element);
    const prototypeDescriptor = Object.getOwnPropertyDescriptor(prototype, "checked");
    const ownDescriptor = Object.getOwnPropertyDescriptor(element, "checked");

    if (prototypeDescriptor && prototypeDescriptor.set && (!ownDescriptor || ownDescriptor.set !== prototypeDescriptor.set)) {
      prototypeDescriptor.set.call(element, checked);
      return;
    }

    element.checked = checked;
  }

  function dispatchInputAndChange(element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function dataUrlToFile(dataUrl, name, type) {
    const parts = dataUrl.split(",");

    if (parts.length < 2) {
      throw new Error("Stored resume data is not a valid DataURL.");
    }

    const meta = parts[0];
    const body = parts.slice(1).join(",");
    const mime = type || (meta.match(/^data:([^;]+)/) || [])[1] || "application/octet-stream";
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new File([bytes], name, { type: mime });
  }

  function normalizeText(value) {
    return trimValue(value)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_./-]+/g, " ")
      .replace(/[?*:()[\]{}']+/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function trimValue(value) {
    return String(value || "").trim();
  }

  function limitText(value, limit) {
    const text = trimValue(value).replace(/\s+/g, " ");
    return text.length > limit ? text.slice(0, limit) : text;
  }

  function uniqueValues(values) {
    const seen = new Set();

    return values.map(trimValue).filter((value) => {
      const key = normalizeText(value);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }

    return String(value).replace(/["\\]/g, "\\$&");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
})();
