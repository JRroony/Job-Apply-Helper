(() => {
  if (window.__localJobAutofillSafeInstalled) {
    return;
  }

  window.__localJobAutofillSafeInstalled = true;

  const FILL_FORM = "FILL_FORM";
  const EXTRACT_JOB_INFO = "EXTRACT_JOB_INFO";
  const SAFE_CLICK_BLOCK_PATTERN = /(?:\.pdf(?:$|[?#])|eeo|equal\s+employment|policy|privacy|terms|definition|learn\s+more|notice|poster|law)/i;
  const QUESTION_CONTAINER_SELECTOR = [
    "fieldset",
    "[role='group']",
    "[data-qa]",
    "[data-test]",
    "[data-testid]",
    ".field",
    ".form-field",
    ".application-question",
    ".question",
    "section",
    "div"
  ].join(",");

  const ARRAY_FIELDS = new Set([
    "genderIdentity",
    "racialEthnicBackground",
    "race",
    "sexualOrientation"
  ]);

  const YES_NO_FIELDS = new Set([
    "workAuthorization",
    "needSponsorship",
    "relocation",
    "hispanicLatino"
  ]);

  const CONTROLLED_FIELDS = new Set([
    "phoneCountryCode",
    "countryOfResidence",
    "state",
    "gender",
    "genderIdentity",
    "hispanicLatino",
    "racialEthnicBackground",
    "race",
    "sexualOrientation",
    "transgenderIdentity",
    "disabilityStatus",
    "veteranStatus",
    "workAuthorization",
    "needSponsorship",
    "relocation"
  ]);

  const FIELD_PATTERNS = {
    firstName: [/\bfirst\s*name\b/i, /\bgiven\s*name\b/i, /\bpreferred\s*first\s*name\b/i],
    lastName: [/\blast\s*name\b/i, /\bfamily\s*name\b/i, /\bsurname\b/i],
    fullName: [/\bfull\s*name\b/i, /\blegal\s*name\b/i, /\bapplicant\s*name\b/i, /\bcandidate\s*name\b/i, /\byour\s*name\b/i],
    email: [/\bemail\b/i, /\be\s*mail\b/i],
    phone: [/\bphone\b/i, /\bmobile\b/i, /\btelephone\b/i, /\btel\b/i],
    phoneCountryCode: [/\bphone\s*country\s*code\b/i, /\bcountry\s*code\b/i],
    addressLine1: [/\baddress\s*line\s*1\b/i, /\bstreet\s*address\b/i, /\baddress\s*1\b/i, /^address$/i, /\bmailing\s*address\b/i],
    addressLine2: [/\baddress\s*line\s*2\b/i, /\baddress\s*2\b/i, /\bapt\b/i, /\bapartment\b/i, /\bsuite\b/i, /\bunit\b/i],
    city: [/^city$/i, /\bcity\b/i, /\btown\b/i, /\baddress\s*level\s*2\b/i],
    state: [/^state$/i, /\bstate\b/i, /\bprovince\b/i, /\bregion\b/i, /\baddress\s*level\s*1\b/i],
    postalCode: [/\bzip\b/i, /\bzipcode\b/i, /\bzip\s*code\b/i, /\bpostal\s*code\b/i, /\bpostcode\b/i],
    countryOfResidence: [/\bcountry\s*of\s*residence\b/i, /\bresidence\s*country\b/i, /\bcurrent\s*country\b/i, /^country$/i, /\bcountry\s*name\b/i],
    location: [/^location$/i, /\bcurrent\s*location\b/i, /\bwhere\s+.*located\b/i, /\bbased\s+in\b/i],
    linkedin: [/\blinkedin\b/i, /\blinked\s*in\b/i],
    github: [/\bgithub\b/i, /\bgit\s*hub\b/i],
    portfolio: [/\bportfolio\b/i, /\bpersonal\s*site\b/i, /\bpersonal\s*website\b/i, /\bwebsite\b/i, /\bhomepage\b/i],
    salary: [/\bsalary\b/i, /\bcompensation\b/i, /\bdesired\s*pay\b/i, /\bexpected\s*pay\b/i, /\bpay\s*range\b/i],
    workAuthorization: [/authorized\s+to\s+work/i, /legally\s+authorized/i, /work\s+authorization/i, /without\s+restrictions/i],
    needSponsorship: [/sponsorship/i, /visa\s+sponsorship/i, /require.*sponsor/i, /need.*sponsor/i, /employment\s+visa\s+status/i, /h-?1b/i, /now\s+or\s+in\s+the\s+future/i],
    relocation: [/\brelocat(?:e|ion|ing)\b/i, /willing\s+to\s+relocate/i, /open\s+to\s+relocation/i],
    gender: [/^gender$/i, /\bsex\b/i],
    genderIdentity: [/gender\s+identity/i, /describe\s+your\s+gender/i],
    hispanicLatino: [/hispanic\s*\/\s*latino/i, /hispanic\s+or\s+latino/i, /latino\s+or\s+hispanic/i],
    race: [/please\s+identify\s+your\s+race/i, /^race$/i, /race\s*\(select/i],
    racialEthnicBackground: [/racial\s*\/\s*ethnic\s+background/i, /racial\s+or\s+ethnic/i, /ethnic\s+background/i, /^ethnicity$/i],
    sexualOrientation: [/sexual\s+orientation/i],
    transgenderIdentity: [/transgender/i, /identify\s+as\s+transgender/i],
    disabilityStatus: [/disability/i, /chronic\s+condition/i, /major\s+life\s+activities/i],
    veteranStatus: [/veteran/i, /protected\s+veteran/i, /armed\s+forces/i, /military\s+service/i],
    coverLetter: [/cover\s*letter/i, /why\s+.*interested/i, /why\s+.*role/i, /additional\s*information/i, /comments?/i],
    resume: [/\bresume\b/i, /\bcv\b/i, /curriculum\s+vitae/i, /upload\s+.*(?:resume|cv)/i, /attach\s+.*(?:resume|cv)/i]
  };

  const MATCH_ORDER = [
    "linkedin",
    "github",
    "portfolio",
    "email",
    "phone",
    "phoneCountryCode",
    "addressLine1",
    "addressLine2",
    "postalCode",
    "city",
    "state",
    "countryOfResidence",
    "firstName",
    "lastName",
    "fullName",
    "salary",
    "genderIdentity",
    "gender",
    "hispanicLatino",
    "race",
    "racialEthnicBackground",
    "sexualOrientation",
    "transgenderIdentity",
    "disabilityStatus",
    "veteranStatus",
    "workAuthorization",
    "needSponsorship",
    "relocation",
    "coverLetter",
    "location"
  ];

  const OPTION_ALIASES = {
    phoneCountryCode: {
      "United States (+1)": ["United States", "United States +1", "United States (+1)", "USA", "US", "U.S.", "+1"],
      "Canada (+1)": ["Canada", "Canada +1", "Canada (+1)", "CA", "+1"],
      "China (+86)": ["China", "China +86", "China (+86)", "PRC", "+86"],
      "India (+91)": ["India", "India +91", "India (+91)", "+91"],
      "United Kingdom (+44)": ["United Kingdom", "UK", "Great Britain", "Britain", "+44"],
      "Other": ["Other"]
    },
    countryOfResidence: {
      "United States": ["United States", "United States of America", "USA", "US", "U.S.", "America"],
      "Canada": ["Canada", "CA"],
      "China": ["China", "PRC", "People's Republic of China"],
      "India": ["India"],
      "United Kingdom": ["United Kingdom", "UK", "Great Britain", "Britain", "England"],
      "Other": ["Other"]
    },
    state: {
      "WA": ["WA", "Washington"],
      "Washington": ["Washington", "WA"],
      "CA": ["CA", "California"],
      "California": ["California", "CA"],
      "NY": ["NY", "New York"],
      "New York": ["New York", "NY"],
      "TX": ["TX", "Texas"],
      "Texas": ["Texas", "TX"],
      "NJ": ["NJ", "New Jersey"],
      "New Jersey": ["New Jersey", "NJ"],
      "MA": ["MA", "Massachusetts"],
      "Massachusetts": ["Massachusetts", "MA"],
      "IL": ["IL", "Illinois"],
      "Illinois": ["Illinois", "IL"]
    },
    gender: {
      "Male": ["Male", "Man", "M"],
      "Female": ["Female", "Woman", "F"],
      "Non-binary": ["Non-binary", "Nonbinary", "Non binary"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
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
      "Not listed": ["Not listed", "Not listed above", "Identity not listed"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    hispanicLatino: {
      "Yes": ["Yes", "Yes, I am Hispanic or Latino", "I am Hispanic or Latino", "Hispanic or Latino"],
      "No": ["No", "No, I am not Hispanic or Latino", "I am not Hispanic or Latino", "Not Hispanic or Latino"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    race: getRaceAliases(),
    racialEthnicBackground: getRaceAliases(),
    sexualOrientation: {
      "Straight / Heterosexual": ["Straight / Heterosexual", "Straight", "Heterosexual"],
      "Gay": ["Gay"],
      "Lesbian": ["Lesbian"],
      "Bisexual": ["Bisexual", "Bi"],
      "Pansexual": ["Pansexual", "Pan"],
      "Queer": ["Queer"],
      "Asexual": ["Asexual", "Ace"],
      "Questioning": ["Questioning"],
      "Not listed": ["Not listed", "Not listed above"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    transgenderIdentity: {
      "Yes": ["Yes"],
      "No": ["No"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    disabilityStatus: {
      "Yes, I have a disability or have had one in the past": ["Yes", "I have a disability", "have had one in the past"],
      "No, I do not have a disability and have not had one in the past": ["No", "I do not have a disability", "do not have a disability"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    veteranStatus: {
      "Yes": ["Yes", "I am a veteran", "protected veteran", "veteran"],
      "No": ["No", "I am not a veteran", "not a protected veteran", "not a veteran"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    },
    workAuthorization: {
      "Yes": ["Yes", "Yes, I am", "Yes, I do"],
      "No": ["No", "No, I am not", "No, I do not"]
    },
    needSponsorship: {
      "Yes": ["Yes", "Yes, I do", "Yes, I will"],
      "No": ["No", "No, I do not", "No, I will not"]
    },
    relocation: {
      "Yes": ["Yes", "Open", "Willing"],
      "No": ["No", "Not open", "Not willing"]
    }
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message) {
      return false;
    }

    if (message.type === FILL_FORM) {
      fillPage(message.profile || {}, message.resume || null, { overwrite: Boolean(message.overwrite) })
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            filledCount: 0,
            resumeAttached: false,
            error: getErrorMessage(error)
          });
        });

      return true;
    }

    if (message.type === EXTRACT_JOB_INFO) {
      try {
        sendResponse({ jobInfo: extractJobInfoFromPage(), error: null });
      } catch (error) {
        sendResponse({ jobInfo: null, error: getErrorMessage(error) });
      }

      return false;
    }

    return false;
  });

  async function fillPage(profile, resume, options = {}) {
    const overwrite = Boolean(options.overwrite);
    const filledControls = new WeakSet();
    let filledCount = 0;
    let resumeAttached = false;

    if (await fillPhoneCountryCode(profile.phoneCountryCode, { overwrite, filledControls })) {
      filledCount += 1;
    }

    filledCount += await fillVoluntarySelfId(profile, { overwrite, filledControls });

    const controls = getFillableControls();

    for (const control of controls) {
      if (filledControls.has(control)) {
        continue;
      }

      if (isFileInput(control)) {
        if (resume && isResumeField(control) && shouldOverwriteControl(control, overwrite) && attachResume(control, resume)) {
          filledControls.add(control);
          filledCount += 1;
          resumeAttached = true;
        }
        continue;
      }

      const key = detectProfileKey(control);
      const value = getProfileValue(profile, key);

      if (!key || !hasValue(value)) {
        continue;
      }

      if (!shouldOverwriteControl(control, overwrite)) {
        continue;
      }

      if (await fillControl(control, key, value, { overwrite })) {
        filledControls.add(control);
        filledCount += 1;
      }
    }

    filledCount += await fillCustomDropdowns(profile, { overwrite, filledControls });

    return { filledCount, resumeAttached, error: null };
  }

  async function fillVoluntarySelfId(profile, options) {
    let count = 0;
    const genderValue = getProfileValue(profile, "gender");
    const genderIdentityValue = getProfileValue(profile, "genderIdentity");
    const hispanicValue = getProfileValue(profile, "hispanicLatino");
    const raceValue = getProfileValue(profile, "race");

    if (hasValue(genderValue) && await fillQuestionByKey("gender", genderValue, options)) {
      count += 1;
    }

    if (hasValue(genderIdentityValue) && await fillQuestionByKey("genderIdentity", genderIdentityValue, options)) {
      count += 1;
    }

    if (hasValue(hispanicValue) && await fillQuestionByKey("hispanicLatino", hispanicValue, options)) {
      count += 1;
    }

    if (hasValue(raceValue) && await fillQuestionByKey("race", raceValue, options)) {
      count += 1;
    }

    return count;
  }

  async function fillQuestionByKey(key, value, options = {}) {
    const containers = findQuestionContainers(key);

    for (const container of containers) {
      if (await fillContainerQuestion(container, key, value, options)) {
        return true;
      }
    }

    return false;
  }

  async function fillContainerQuestion(container, key, value, options = {}) {
    const overwrite = Boolean(options.overwrite);
    const filledControls = options.filledControls;
    const controls = Array.from(container.querySelectorAll("input, textarea, select"))
      .filter((control) => isVisibleElement(control) && !filledControls.has(control));

    const select = controls.find((control) => control instanceof HTMLSelectElement);
    if (select && shouldOverwriteControl(select, overwrite) && fillSelect(select, key, value)) {
      filledControls.add(select);
      return true;
    }

    const radios = controls.filter(isRadio);
    if (radios.length && (!radioGroupHasSelection(radios[0]) || overwrite) && fillRadioGroup(radios[0], key, value)) {
      getRadioGroup(radios[0]).forEach((radio) => filledControls.add(radio));
      return true;
    }

    const checkboxes = controls.filter(isCheckbox);
    if (checkboxes.length && fillCheckboxes(checkboxes, key, value, { overwrite })) {
      checkboxes.forEach((checkbox) => filledControls.add(checkbox));
      return true;
    }

    const dropdown = findSafeDropdownTrigger(container);
    if (dropdown && await fillDropdownLikeField(dropdown, key, value, { overwrite })) {
      filledControls.add(dropdown);
      return true;
    }

    return false;
  }

  function findQuestionContainers(key) {
    const patterns = FIELD_PATTERNS[key] || [];
    const containers = Array.from(document.querySelectorAll(QUESTION_CONTAINER_SELECTOR)).filter((element) => {
      if (!isVisibleElement(element) || hasBlockedLinkOnlyContext(element)) {
        return false;
      }

      const controls = element.querySelectorAll("input, select, textarea, [role='combobox'], [aria-haspopup='listbox'], [aria-expanded], button");
      if (!controls.length) {
        return false;
      }

      const text = getCleanElementText(element, 700);
      return patterns.some((pattern) => pattern.test(text));
    });

    return containers
      .sort((first, second) => getElementScore(first) - getElementScore(second))
      .filter((element, index, list) => !list.some((other, otherIndex) => otherIndex < index && other.contains(element)));
  }

  function getElementScore(element) {
    const rect = element.getBoundingClientRect();
    const controls = element.querySelectorAll("input, select, textarea, button, [role='combobox']").length;
    return Math.max(0, rect.width * rect.height) + controls * 500;
  }

  async function fillCustomDropdowns(profile, options = {}) {
    let count = 0;
    const triggers = Array.from(document.querySelectorAll("select, [role='combobox'], [aria-haspopup='listbox'], [aria-expanded], button"))
      .filter((element) => element instanceof HTMLSelectElement || isSafeDropdownTrigger(element));

    for (const trigger of triggers) {
      if (options.filledControls.has(trigger)) {
        continue;
      }

      const key = detectProfileKey(trigger);
      const value = getProfileValue(profile, key);

      if (!key || !CONTROLLED_FIELDS.has(key) || !hasValue(value)) {
        continue;
      }

      if (trigger instanceof HTMLSelectElement) {
        if (shouldOverwriteControl(trigger, options.overwrite) && fillSelect(trigger, key, value)) {
          options.filledControls.add(trigger);
          count += 1;
        }
        continue;
      }

      if (await fillDropdownLikeField(trigger, key, value, options)) {
        options.filledControls.add(trigger);
        count += 1;
      }
    }

    return count;
  }

  async function fillControl(control, key, value, options = {}) {
    if (control instanceof HTMLSelectElement) {
      return fillSelect(control, key, value);
    }

    if (isRadio(control)) {
      return fillRadioGroup(control, key, value);
    }

    if (isCheckbox(control)) {
      return fillCheckboxes([control], key, value, options);
    }

    if (CONTROLLED_FIELDS.has(key)) {
      return false;
    }

    return fillTextControl(control, value);
  }

  function getFillableControls() {
    return Array.from(document.querySelectorAll("input, textarea, select")).filter((control) => {
      if (!isVisibleElement(control) || control.disabled || control.getAttribute("aria-disabled") === "true") {
        return false;
      }

      if (control instanceof HTMLInputElement) {
        const type = (control.type || "text").toLowerCase();
        return !["button", "color", "hidden", "image", "password", "range", "reset", "submit"].includes(type);
      }

      return control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement;
    });
  }

  function detectProfileKey(control) {
    const autoKey = detectByAutocomplete(control);
    if (autoKey) {
      return autoKey;
    }

    if (control instanceof HTMLInputElement) {
      const type = (control.type || "").toLowerCase();
      if (type === "email") return "email";
      if (type === "tel") return "phone";
    }

    const text = getFieldContext(control);

    for (const key of MATCH_ORDER) {
      if (key === "location" && isAddressSpecificContext(text)) {
        continue;
      }
      if (key === "countryOfResidence" && isPhoneCountryContext(text)) {
        continue;
      }
      if (matchesAny(text, FIELD_PATTERNS[key] || [])) {
        return key;
      }
    }

    return null;
  }

  function detectByAutocomplete(control) {
    const autocomplete = normalizeText(control.getAttribute("autocomplete") || "");
    if (!autocomplete) return null;
    if (/given\s*name/.test(autocomplete)) return "firstName";
    if (/family\s*name/.test(autocomplete)) return "lastName";
    if (/\bemail\b/.test(autocomplete)) return "email";
    if (/\btel\b|phone/.test(autocomplete)) return "phone";
    if (/address\s*line\s*1/.test(autocomplete)) return "addressLine1";
    if (/address\s*line\s*2/.test(autocomplete)) return "addressLine2";
    if (/address\s*level\s*2|\bcity\b/.test(autocomplete)) return "city";
    if (/address\s*level\s*1|\bstate\b|province|region/.test(autocomplete)) return "state";
    if (/postal\s*code|zip/.test(autocomplete)) return "postalCode";
    if (/country/.test(autocomplete)) return "countryOfResidence";
    if (/\bname\b/.test(autocomplete)) return "fullName";
    if (/\burl\b/.test(autocomplete)) return "portfolio";
    return null;
  }

  function getProfileValue(profile, key) {
    if (!key) return "";

    if (key === "fullName") {
      return clean(profile.fullName) || [profile.firstName, profile.lastName].map(clean).filter(Boolean).join(" ");
    }

    if (key === "gender") {
      return clean(profile.gender) || genderFromIdentity(profile.genderIdentity);
    }

    if (key === "race") {
      const race = normalizeArray(profile.race);
      return race.length ? race : normalizeArray(profile.racialEthnicBackground);
    }

    if (ARRAY_FIELDS.has(key)) {
      return normalizeArray(profile[key]);
    }

    return clean(profile[key]);
  }

  function genderFromIdentity(value) {
    const values = normalizeArray(value).map(normalizeText);
    if (values.includes("man")) return "Male";
    if (values.includes("woman")) return "Female";
    if (values.includes("non binary") || values.includes("nonbinary")) return "Non-binary";
    if (values.includes("prefer not to answer")) return "Prefer not to answer";
    return "";
  }

  async function fillPhoneCountryCode(value, options = {}) {
    if (!hasValue(value)) return false;
    const phoneInput = Array.from(document.querySelectorAll("input, textarea")).find((control) => {
      return isVisibleElement(control) && detectProfileKey(control) === "phone";
    });
    if (!phoneInput) return false;
    const dropdown = findPhoneCountryDropdown(phoneInput);
    if (!dropdown) return false;
    if (!shouldOverwriteControl(dropdown, options.overwrite)) return false;

    if (dropdown instanceof HTMLSelectElement) {
      const filled = fillSelect(dropdown, "phoneCountryCode", value);
      if (filled) options.filledControls.add(dropdown);
      return filled;
    }

    const filled = await fillDropdownLikeField(dropdown, "phoneCountryCode", value, options);
    if (filled) options.filledControls.add(dropdown);
    return filled;
  }

  function findPhoneCountryDropdown(phoneInput) {
    const phoneRect = phoneInput.getBoundingClientRect();
    const candidates = [];
    let container = phoneInput.parentElement;
    let depth = 0;

    while (container && depth < 5) {
      const possible = Array.from(container.querySelectorAll("select, [role='combobox'], [aria-haspopup='listbox'], [aria-expanded], button"));
      possible.forEach((candidate) => {
        if (candidate === phoneInput || candidate.contains(phoneInput) || !isVisibleElement(candidate) || !isSafeDropdownCandidate(candidate)) {
          return;
        }
        const rect = candidate.getBoundingClientRect();
        const sameRow = Math.abs((rect.top + rect.height / 2) - (phoneRect.top + phoneRect.height / 2)) < 80;
        const leftOfPhone = rect.right <= phoneRect.left + 24 || rect.left < phoneRect.left;
        const narrower = rect.width < phoneRect.width;
        const context = getFieldContext(candidate);
        if (sameRow && leftOfPhone && narrower && !/country\s+of\s+residence|residence\s+country|current\s+country/i.test(context)) {
          candidates.push({ element: candidate, score: depth * 100 + Math.abs(phoneRect.left - rect.right) });
        }
      });
      container = container.parentElement;
      depth += 1;
    }

    candidates.sort((a, b) => a.score - b.score);
    return candidates.length ? candidates[0].element : null;
  }

  function fillTextControl(control, value) {
    if (Array.isArray(value) || control.readOnly) return false;
    setNativeValue(control, value);
    dispatchInputAndChange(control);
    return true;
  }

  function fillSelect(select, key, value) {
    const values = normalizeArray(value);
    if (!values.length) return false;
    let count = 0;
    const options = Array.from(select.options);

    values.forEach((item) => {
      const option = findMatchingOption(options, key, item);
      if (!option) return;
      if (select.multiple) {
        option.selected = true;
        count += 1;
      } else if (count === 0) {
        setNativeValue(select, option.value);
        option.selected = true;
        count += 1;
      }
    });

    if (!count) return false;
    dispatchInputAndChange(select);
    return true;
  }

  function fillRadioGroup(radio, key, value) {
    const radios = getRadioGroup(radio).filter(isVisibleElement);
    const values = normalizeArray(value);
    for (const item of values) {
      const target = radios.find((candidate) => optionTextMatches(getChoiceText(candidate), key, item));
      if (target && !target.disabled) {
        setNativeChecked(target, true);
        dispatchInputAndChange(target);
        return true;
      }
    }
    return false;
  }

  function fillCheckboxes(checkboxes, key, value, options = {}) {
    const values = normalizeArray(value);
    if (!values.length) return false;
    let changed = 0;

    checkboxes.filter(isVisibleElement).forEach((checkbox) => {
      if (!options.overwrite && checkbox.checked) return;
      const text = getChoiceText(checkbox);
      const shouldCheck = values.some((item) => optionTextMatches(text, key, item));
      if (shouldCheck) {
        setNativeChecked(checkbox, true);
        dispatchInputAndChange(checkbox);
        changed += 1;
      }
    });

    return changed > 0;
  }

  async function fillDropdownLikeField(trigger, key, value, options = {}) {
    if (!isSafeDropdownTrigger(trigger) || (!options.overwrite && dropdownHasSelection(trigger, key))) {
      return false;
    }

    const values = normalizeArray(value);
    let selected = 0;

    for (const item of values) {
      if (!safeClick(trigger)) return false;
      await wait(220);
      const option = findVisibleOption(key, item);
      if (!option) {
        closeDropdown(trigger);
        continue;
      }
      if (!safeClick(option)) {
        closeDropdown(trigger);
        continue;
      }
      dispatchInputAndChange(trigger);
      selected += 1;
      await wait(120);
    }

    closeDropdown(trigger);
    return selected > 0;
  }

  function findVisibleOption(key, value) {
    const candidates = Array.from(document.querySelectorAll("[role='option'], [role='menuitem'], li, button, div, span"))
      .filter((element) => isVisibleElement(element) && !shouldNeverClick(element) && isOptionLike(element));

    return candidates.find((element) => optionTextMatches(getOptionText(element), key, value, true)) ||
      candidates.find((element) => optionTextMatches(getOptionText(element), key, value, false)) || null;
  }

  function findMatchingOption(options, key, value) {
    return options.find((option) => optionTextMatches(getOptionText(option), key, value, true)) ||
      options.find((option) => optionTextMatches(getOptionText(option), key, value, false)) || null;
  }

  function optionTextMatches(optionText, key, value, exactOnly = false) {
    const option = normalizeText(optionText);
    const aliases = getAliases(key, value).map(normalizeText).filter(Boolean);
    if (!option || !aliases.length) return false;

    if (aliases.some((alias) => option === alias)) return true;
    if (exactOnly) return false;
    if (hasContradiction(option, key, value)) return false;

    return aliases.some((alias) => {
      if (!alias) return false;
      if (/^\+\d+$/.test(alias)) return option === alias;
      if (alias.length <= 2) return new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(option);
      return option.includes(alias) || alias.includes(option);
    });
  }

  function hasContradiction(option, key, value) {
    const desired = normalizeText(value);
    if (["hispanicLatino", "workAuthorization", "needSponsorship", "relocation", "veteranStatus", "transgenderIdentity"].includes(key)) {
      if (desired === "yes") return /\b(no|not|decline|prefer)\b/i.test(option);
      if (desired === "no") return /\b(yes|am|do|will)\b/i.test(option) && !/\bnot\b/i.test(option);
    }
    return false;
  }

  function getAliases(key, value) {
    const saved = clean(value);
    const aliases = [saved];
    const fieldAliases = OPTION_ALIASES[key] || {};
    if (fieldAliases[saved]) aliases.push(...fieldAliases[saved]);
    if (saved === "Prefer not to answer") aliases.push(...getPreferNotToAnswerAliases());
    return unique(aliases);
  }

  function shouldOverwriteControl(control, overwrite) {
    if (overwrite) return true;
    if (control instanceof HTMLSelectElement) return !selectHasSelection(control);
    if (isRadio(control)) return !radioGroupHasSelection(control);
    if (isCheckbox(control)) return !control.checked;
    if (isFileInput(control)) return !control.files || !control.files.length;
    return !clean(control.value);
  }

  function selectHasSelection(select) {
    const option = select.selectedOptions && select.selectedOptions[0];
    return Boolean(clean(select.value) || (option && option.index > 0 && clean(option.textContent)));
  }

  function dropdownHasSelection(element, key) {
    const text = normalizeText(getCleanElementText(element, 160));
    if (!text || /^(select|select one|choose|choose one|please select)$/i.test(text)) return false;
    return Object.keys(OPTION_ALIASES[key] || {}).some((option) => optionTextMatches(text, key, option));
  }

  function radioGroupHasSelection(radio) {
    return getRadioGroup(radio).some((item) => item.checked);
  }

  function getRadioGroup(radio) {
    const name = radio.getAttribute("name");
    const root = radio.form || document;
    if (!name) return [radio];
    return Array.from(root.querySelectorAll(`input[type="radio"][name="${cssEscape(name)}"]`));
  }

  function getChoiceText(input) {
    const parts = [];
    if (input.labels) Array.from(input.labels).forEach((label) => parts.push(getCleanElementText(label, 240)));
    const id = input.getAttribute("id");
    if (id) document.querySelectorAll(`label[for="${cssEscape(id)}"]`).forEach((label) => parts.push(getCleanElementText(label, 240)));
    const label = input.closest("label");
    if (label) parts.push(getCleanElementText(label, 240));
    const parent = input.parentElement;
    if (parent) parts.push(getCleanElementText(parent, 240));
    parts.push(input.value || "", input.getAttribute("aria-label") || "");
    return unique(parts).join(" ");
  }

  function getFieldContext(control) {
    const parts = [
      control.getAttribute("aria-label") || "",
      control.getAttribute("placeholder") || "",
      control.getAttribute("name") || "",
      control.getAttribute("id") || "",
      control.getAttribute("autocomplete") || "",
      control.getAttribute("title") || "",
      control.getAttribute("data-testid") || "",
      control.getAttribute("data-test") || "",
      control.getAttribute("data-qa") || "",
      getAriaLabelledByText(control),
      getLabelText(control),
      getNearbyText(control)
    ];
    return normalizeText(parts.join(" "));
  }

  function getLabelText(control) {
    const parts = [];
    if (control.labels) Array.from(control.labels).forEach((label) => parts.push(getCleanElementText(label, 240)));
    const id = control.getAttribute("id");
    if (id) document.querySelectorAll(`label[for="${cssEscape(id)}"]`).forEach((label) => parts.push(getCleanElementText(label, 240)));
    const wrappingLabel = control.closest("label");
    if (wrappingLabel) parts.push(getCleanElementText(wrappingLabel, 240));
    return parts.join(" ");
  }

  function getNearbyText(control) {
    const parts = [];
    if (control.previousElementSibling) parts.push(getCleanElementText(control.previousElementSibling, 200));
    let current = control.parentElement;
    let depth = 0;
    while (current && depth < 3) {
      const legend = current.querySelector(":scope > legend");
      if (legend) parts.push(getCleanElementText(legend, 200));
      parts.push(getCleanContainerText(current, control, 300));
      current = current.parentElement;
      depth += 1;
    }
    return parts.join(" ");
  }

  function getCleanContainerText(container, control, limit) {
    const clone = container.cloneNode(true);
    clone.querySelectorAll("a[href], script, style, input, textarea, select, option, button").forEach((node) => {
      if (node !== control && !node.contains(control)) node.remove();
    });
    return limitText(clone.textContent || "", limit);
  }

  function getCleanElementText(element, limit = 240) {
    if (!element) return "";
    const clone = element.cloneNode(true);
    clone.querySelectorAll("a[href], script, style").forEach((node) => node.remove());
    return limitText(clone.innerText || clone.textContent || "", limit);
  }

  function getAriaLabelledByText(element) {
    return (element.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => {
      const target = document.getElementById(id);
      return target ? getCleanElementText(target, 240) : "";
    }).join(" ");
  }

  function findSafeDropdownTrigger(container) {
    return Array.from(container.querySelectorAll("select, [role='combobox'], [aria-haspopup='listbox'], [aria-expanded], button"))
      .find((element) => element instanceof HTMLSelectElement || isSafeDropdownTrigger(element)) || null;
  }

  function isSafeDropdownCandidate(element) {
    return element instanceof HTMLSelectElement || isSafeDropdownTrigger(element);
  }

  function isSafeDropdownTrigger(element) {
    if (!element || !(element instanceof Element) || !isVisibleElement(element) || shouldNeverClick(element)) {
      return false;
    }
    if (element instanceof HTMLSelectElement) return true;
    const role = normalizeText(element.getAttribute("role") || "");
    const ariaHasPopup = normalizeText(element.getAttribute("aria-haspopup") || "");
    if (role === "combobox" || role === "listbox") return true;
    if (ariaHasPopup === "listbox" || ariaHasPopup === "menu") return true;
    if (element.hasAttribute("aria-expanded") && !element.closest("a[href]")) return true;
    if (element.tagName === "BUTTON") {
      const text = normalizeText([element.id, element.className, element.getAttribute("data-testid") || "", getCleanElementText(element, 80)].join(" "));
      return /select|dropdown|choose|combobox|listbox|caret|arrow|chevron/.test(text);
    }
    return false;
  }

  function isOptionLike(element) {
    if (shouldNeverClick(element)) return false;
    const role = normalizeText(element.getAttribute("role") || "");
    const parentRole = normalizeText(element.parentElement ? element.parentElement.getAttribute("role") || "" : "");
    if (["option", "menuitem", "treeitem"].includes(role)) return true;
    if (["listbox", "menu", "tree"].includes(parentRole)) return true;
    if (element.tagName === "LI") return true;
    const attr = normalizeText([element.className, element.id, element.getAttribute("data-testid") || "", element.getAttribute("data-test") || ""].join(" "));
    return /option|choice|menu\s*item/.test(attr);
  }

  function shouldNeverClick(element) {
    if (!element || !(element instanceof Element)) return true;
    const link = element.closest("a[href]");
    const text = normalizeText([
      element.textContent || "",
      element.getAttribute("aria-label") || "",
      element.getAttribute("title") || "",
      link ? link.getAttribute("href") || "" : ""
    ].join(" "));
    return Boolean(link) || SAFE_CLICK_BLOCK_PATTERN.test(text) || isForbiddenActionText(text);
  }

  function safeClick(element) {
    if (shouldNeverClick(element)) {
      console.warn("Blocked unsafe autofill click.", { text: getCleanElementText(element, 120) });
      return false;
    }
    if (typeof element.scrollIntoView === "function") element.scrollIntoView({ block: "center", inline: "nearest" });
    if (typeof element.focus === "function") element.focus();
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    element.click();
    return true;
  }

  function isForbiddenActionText(text) {
    return /\b(submit|apply|continue|next|save|finish|review|send)\b/i.test(text || "");
  }

  function hasBlockedLinkOnlyContext(element) {
    const links = Array.from(element.querySelectorAll("a[href]")).filter((link) => SAFE_CLICK_BLOCK_PATTERN.test(`${link.href} ${link.textContent}`));
    const controls = element.querySelectorAll("input, select, textarea, button, [role='combobox']");
    return links.length > 0 && controls.length === links.length;
  }

  function getOptionText(element) {
    if (element instanceof HTMLOptionElement) {
      return [element.textContent || "", element.value || ""].join(" ");
    }
    return [
      getCleanElementText(element, 240),
      typeof element.value === "string" ? element.value : "",
      element.getAttribute("aria-label") || "",
      element.getAttribute("data-value") || "",
      element.getAttribute("title") || ""
    ].join(" ");
  }

  function closeDropdown(element) {
    const options = { bubbles: true, cancelable: true, key: "Escape", code: "Escape" };
    element.dispatchEvent(new KeyboardEvent("keydown", options));
    document.dispatchEvent(new KeyboardEvent("keydown", options));
    if (typeof element.blur === "function") element.blur();
  }

  function attachResume(input, resume) {
    if (!resume || !resume.dataUrl || input.disabled) return false;
    try {
      const file = dataUrlToFile(resume.dataUrl, resume.name || "resume", resume.type || "application/octet-stream");
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      dispatchInputAndChange(input);
      return input.files && input.files.length > 0;
    } catch (error) {
      console.warn("Resume attachment failed.", error);
      return false;
    }
  }

  function isResumeField(input) {
    const text = getFieldContext(input);
    const accept = normalizeText(input.getAttribute("accept") || "");
    return matchesAny(text, FIELD_PATTERNS.resume) || (/pdf|docx?|msword|wordprocessingml/.test(accept) && !/cover\s*letter/.test(text));
  }

  function extractJobInfoFromPage() {
    const jsonLd = extractJobInfoFromStructuredData();
    if (jsonLd) return finalizeJobInfo(jsonLd);
    const parsed = parseTitleAndCompanyFromDocumentTitle(document.title, window.location.hostname);
    return finalizeJobInfo({
      title: getFirstText(["h1", "[data-qa='job-title']", "[data-testid*='job-title']"]) || parsed.title || document.title,
      company: getMetaContent("meta[property='og:site_name']") || parsed.company || hostnameToCompany(window.location.hostname),
      application_url: window.location.href,
      source: getHostnameSource(window.location.href)
    });
  }

  function extractJobInfoFromStructuredData() {
    for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const json = JSON.parse(script.textContent || "null");
        const job = findJobPosting(json);
        if (job) {
          return {
            title: jsonLdString(job.title),
            company: jsonLdOrganizationName(job.hiringOrganization),
            application_url: jsonLdString(job.url) || window.location.href,
            source: getHostnameSource(window.location.href)
          };
        }
      } catch (_error) {}
    }
    return null;
  }

  function findJobPosting(value) {
    if (!value) return null;
    if (Array.isArray(value)) return value.map(findJobPosting).find(Boolean) || null;
    if (typeof value !== "object") return null;
    if (String(value["@type"] || "").toLowerCase().includes("jobposting")) return value;
    if (value["@graph"]) return findJobPosting(value["@graph"]);
    for (const key of Object.keys(value)) {
      const found = findJobPosting(value[key]);
      if (found) return found;
    }
    return null;
  }

  function finalizeJobInfo(jobInfo) {
    const parsed = parseTitleAndCompanyFromDocumentTitle(document.title, window.location.hostname);
    return {
      title: clean(jobInfo.title) || parsed.title || "Untitled role",
      company: clean(jobInfo.company) || parsed.company || hostnameToCompany(window.location.hostname) || "Unknown company",
      application_url: clean(jobInfo.application_url) || window.location.href,
      source: clean(jobInfo.source) || getHostnameSource(window.location.href)
    };
  }

  function parseTitleAndCompanyFromDocumentTitle(title, hostname) {
    const text = clean(title).replace(/^job\s+application\s+for\s+/i, "");
    const hostCompany = hostnameToCompany(hostname);
    const atMatch = text.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) return { title: clean(atMatch[1]), company: clean(atMatch[2]) };
    const parts = text.split(/\s+[|–—-]\s+/).map(clean).filter(Boolean);
    if (parts.length >= 2) {
      const firstLooksJob = /engineer|developer|manager|analyst|designer|scientist|specialist|consultant|architect|software|data|product|backend|frontend|full stack|senior|staff/i.test(parts[0]);
      return firstLooksJob ? { title: parts[0], company: parts.slice(1).join(" - ") } : { title: parts.slice(1).join(" - "), company: parts[0] || hostCompany };
    }
    return { title: text, company: "" };
  }

  function getFirstText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const text = element ? getCleanElementText(element, 240) : "";
      if (text) return text;
    }
    return "";
  }

  function getMetaContent(selector) {
    const element = document.querySelector(selector);
    return element ? clean(element.getAttribute("content")) : "";
  }

  function getHostnameSource(value) {
    const hostname = getHostname(value);
    if (/greenhouse/i.test(hostname)) return "greenhouse";
    if (/lever\.co$/i.test(hostname)) return "lever";
    if (/ashbyhq\.com$/i.test(hostname)) return "ashby";
    if (/workdayjobs\.com$/i.test(hostname)) return "workday";
    return hostname.replace(/^www\./i, "");
  }

  function hostnameToCompany(hostname) {
    return String(hostname || "").toLowerCase().replace(/^www\./, "").replace(/^(jobs|careers|apply|boards|app|recruiting)\./, "").split(".")[0] || "";
  }

  function getHostname(value) {
    try { return new URL(value || window.location.href).hostname.toLowerCase(); } catch (_error) { return window.location.hostname.toLowerCase(); }
  }

  function jsonLdString(value) {
    if (Array.isArray(value)) return value.map(jsonLdString).find(Boolean) || "";
    return typeof value === "string" || typeof value === "number" ? clean(value) : "";
  }

  function jsonLdOrganizationName(value) {
    if (Array.isArray(value)) return value.map(jsonLdOrganizationName).find(Boolean) || "";
    if (!value) return "";
    if (typeof value === "string") return clean(value);
    return jsonLdString(value.name);
  }

  function dataUrlToFile(dataUrl, name, type) {
    const parts = dataUrl.split(",");
    const meta = parts[0] || "";
    const body = parts.slice(1).join(",");
    const mime = type || (meta.match(/^data:([^;]+)/) || [])[1] || "application/octet-stream";
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new File([bytes], name, { type: mime });
  }

  function isAddressSpecificContext(text) {
    return /\b(address|city|state|province|region|country|postal|zip|postcode)\b/i.test(text);
  }

  function isPhoneCountryContext(text) {
    return /phone\s*country|country\s*code|\+\d{1,3}/i.test(text) && !/country\s+of\s+residence|current\s+country|residence\s+country/i.test(text);
  }

  function isFileInput(control) { return control instanceof HTMLInputElement && (control.type || "").toLowerCase() === "file"; }
  function isRadio(control) { return control instanceof HTMLInputElement && (control.type || "").toLowerCase() === "radio"; }
  function isCheckbox(control) { return control instanceof HTMLInputElement && (control.type || "").toLowerCase() === "checkbox"; }
  function matchesAny(text, patterns) { return patterns.some((pattern) => pattern.test(text)); }
  function hasValue(value) { return Array.isArray(value) ? value.some((item) => clean(item)) : Boolean(clean(value)); }
  function normalizeArray(value) { return Array.isArray(value) ? value.map(clean).filter(Boolean) : (clean(value) ? [clean(value)] : []); }
  function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
  function normalizeText(value) { return clean(value).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_./-]+/g, " ").replace(/[?*:()[\]{}'’]+/g, " ").replace(/\s+/g, " ").toLowerCase(); }
  function limitText(value, limit) { const text = clean(value); return text.length > limit ? text.slice(0, limit) : text; }
  function unique(values) { const seen = new Set(); return values.map(clean).filter((value) => { const key = normalizeText(value); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
  function wait(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
  function isVisibleElement(element) { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0 && rect.height > 0; }
  function cssEscape(value) { return window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, "\\$&"); }
  function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function getErrorMessage(error) { return error && error.message ? error.message : String(error); }

  function setNativeValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) descriptor.set.call(element, value); else element.value = value;
  }

  function setNativeChecked(element, checked) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "checked");
    if (descriptor && descriptor.set) descriptor.set.call(element, checked); else element.checked = checked;
  }

  function dispatchInputAndChange(element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
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

  function getRaceAliases() {
    return {
      "American Indian or Alaska Native": ["American Indian or Alaska Native", "Native American", "American Indian", "Alaska Native", "Indigenous"],
      "Asian": ["Asian"],
      "Black or African American": ["Black or African American", "Black", "African American"],
      "Hispanic or Latino/a/x": ["Hispanic or Latino/a/x", "Hispanic", "Latino", "Latina", "Latinx", "Hispanic or Latino"],
      "Middle Eastern or North African": ["Middle Eastern or North African", "Middle Eastern", "North African", "MENA"],
      "Native Hawaiian or Other Pacific Islander": ["Native Hawaiian or Other Pacific Islander", "Native Hawaiian", "Pacific Islander"],
      "White": ["White", "Caucasian"],
      "Two or more races": ["Two or more races", "Two or More Races", "Multiracial", "Multiple races"],
      "Not listed": ["Not listed", "Not listed above", "Race not listed"],
      "Prefer not to answer": getPreferNotToAnswerAliases()
    };
  }
})();
