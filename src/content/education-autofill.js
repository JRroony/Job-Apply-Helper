(() => {
  if (window.__localJobEducationAutofillInstalled) {
    return;
  }

  window.__localJobEducationAutofillInstalled = true;

  const FILL_FORM = "FILL_FORM";
  const BLOCKED_CLICK_PATTERN = /(?:\.pdf(?:$|[?#])|eeo|equal\s+employment|policy|privacy|terms|definition|learn\s+more|notice|poster|law|submit|apply|continue|next|review|send|finish)/i;
  const EDUCATION_FIELD_PATTERNS = {
    schoolName: [/^school$/i, /school\s*name/i, /university/i, /college/i, /institution/i],
    degree: [/^degree\*?$/i, /degree\s*type/i, /highest\s*degree/i, /education\s*level/i],
    discipline: [/^discipline$/i, /field\s*of\s*study/i, /major/i, /area\s*of\s*study/i, /concentration/i],
    educationStartYear: [/start\s*date\s*year/i, /start\s*year/i, /from\s*year/i],
    educationEndYear: [/end\s*date\s*year/i, /end\s*year/i, /graduation\s*year/i, /graduate\s*year/i, /to\s*year/i]
  };

  const DEGREE_ALIASES = {
    "High School": ["High School", "High School Diploma", "Secondary School"],
    "Associate Degree": ["Associate Degree", "Associate", "AA", "AS", "A.A.", "A.S."],
    "Bachelor's Degree": ["Bachelor's Degree", "Bachelors Degree", "Bachelor", "Bachelor's", "BS", "B.S.", "BA", "B.A.", "Bachelor of Science", "Bachelor of Arts"],
    "Master's Degree": ["Master's Degree", "Masters Degree", "Master", "Master's", "MS", "M.S.", "MA", "M.A.", "Master of Science", "Master of Arts"],
    "Doctorate / PhD": ["Doctorate / PhD", "Doctorate", "PhD", "Ph.D.", "Doctor of Philosophy"],
    "Bootcamp": ["Bootcamp", "Coding Bootcamp"],
    "Other": ["Other"]
  };

  const DISCIPLINE_ALIASES = {
    "Computer Science": ["Computer Science", "CS", "Computer and Information Science", "Software Engineering", "Computer Engineering"],
    "Software Engineering": ["Software Engineering", "Computer Science", "CS"],
    "Information Technology": ["Information Technology", "IT"],
    "Data Science": ["Data Science"],
    "Other": ["Other"]
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== FILL_FORM) {
      return false;
    }

    window.setTimeout(() => {
      fillEducationSection(message.profile || {}, { overwrite: Boolean(message.overwrite) })
        .catch((error) => console.warn("Education autofill failed.", error));
    }, 300);

    return false;
  });

  async function fillEducationSection(profile, options = {}) {
    const educationProfile = {
      schoolName: clean(profile.schoolName),
      degree: clean(profile.degree),
      discipline: clean(profile.discipline),
      educationStartYear: clean(profile.educationStartYear),
      educationEndYear: clean(profile.educationEndYear)
    };

    if (!Object.values(educationProfile).some(Boolean)) {
      return 0;
    }

    const root = findEducationRoot();
    let filledCount = 0;

    if (educationProfile.schoolName && await fillEducationField(root, "schoolName", educationProfile.schoolName, options)) {
      filledCount += 1;
    }

    if (educationProfile.degree && await fillEducationField(root, "degree", educationProfile.degree, options)) {
      filledCount += 1;
    }

    if (educationProfile.discipline && await fillEducationField(root, "discipline", educationProfile.discipline, options)) {
      filledCount += 1;
    }

    if (educationProfile.educationStartYear && await fillEducationField(root, "educationStartYear", educationProfile.educationStartYear, options)) {
      filledCount += 1;
    }

    if (educationProfile.educationEndYear && await fillEducationField(root, "educationEndYear", educationProfile.educationEndYear, options)) {
      filledCount += 1;
    }

    return filledCount;
  }

  async function fillEducationField(root, key, value, options = {}) {
    const containers = findEducationFieldContainers(root, key);

    for (const container of containers) {
      if (await fillContainer(container, key, value, options)) {
        return true;
      }
    }

    return false;
  }

  async function fillContainer(container, key, value, options = {}) {
    const controls = getControls(container);
    const textControl = controls.find((control) => isTextInput(control));
    const select = controls.find((control) => control instanceof HTMLSelectElement);

    if ((key === "educationStartYear" || key === "educationEndYear") && textControl) {
      if (!shouldOverwriteText(textControl, options.overwrite)) {
        return false;
      }

      setNativeValue(textControl, value);
      dispatchInputAndChange(textControl);
      return true;
    }

    if (select) {
      if (!options.overwrite && selectHasSelection(select)) {
        return false;
      }

      return fillSelect(select, key, value);
    }

    const trigger = findDropdownTrigger(container);
    if (trigger) {
      return fillDropdown(trigger, key, value, options);
    }

    if (textControl && (key === "schoolName" || key === "discipline")) {
      if (!shouldOverwriteText(textControl, options.overwrite)) {
        return false;
      }

      setNativeValue(textControl, value);
      dispatchInputAndChange(textControl);
      return true;
    }

    return false;
  }

  async function fillDropdown(trigger, key, value, options = {}) {
    if (!isSafeDropdownTrigger(trigger)) {
      return false;
    }

    if (!options.overwrite && dropdownHasSelection(trigger, key)) {
      return false;
    }

    if (!safeClick(trigger)) {
      return false;
    }

    await wait(250);

    let option = findMatchingVisibleOption(key, value);

    if (!option && (key === "schoolName" || key === "discipline")) {
      const searchInput = findVisibleSearchInput();

      if (searchInput) {
        setNativeValue(searchInput, value);
        dispatchInputAndChange(searchInput);
        searchInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: value[0] || "a" }));
        await wait(500);
        option = findMatchingVisibleOption(key, value);
      }
    }

    if (!option) {
      closeDropdown(trigger);
      console.warn("No matching education dropdown option found.", { field: key, value });
      return false;
    }

    if (!safeClick(option)) {
      closeDropdown(trigger);
      return false;
    }

    dispatchInputAndChange(trigger);
    await wait(120);
    closeDropdown(trigger);
    return true;
  }

  function findEducationRoot() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, legend, [role='heading']"));
    const heading = headings.find((element) => /\beducation\b/i.test(cleanText(element, 120)));

    if (!heading) {
      return document;
    }

    let current = heading.parentElement;
    let best = current || document;
    let depth = 0;

    while (current && depth < 5) {
      const text = cleanText(current, 1800);
      const hasEducationFields = /\bschool\b/i.test(text) && /\bdegree\b/i.test(text);

      if (hasEducationFields) {
        best = current;
        break;
      }

      current = current.parentElement;
      depth += 1;
    }

    return best || document;
  }

  function findEducationFieldContainers(root, key) {
    const patterns = EDUCATION_FIELD_PATTERNS[key] || [];
    const candidates = Array.from(root.querySelectorAll("label, fieldset, [role='group'], [data-qa], [data-test], [data-testid], .field, .form-field, .question, section, div"))
      .filter((element) => {
        if (!isVisible(element) || shouldNeverClick(element)) {
          return false;
        }

        const controls = getControls(element);
        if (!controls.length && !findDropdownTrigger(element)) {
          return false;
        }

        const text = getFieldContainerText(element);
        return patterns.some((pattern) => pattern.test(text));
      })
      .map((element) => ({ element, score: scoreContainer(element) }))
      .sort((first, second) => first.score - second.score)
      .map((item) => item.element);

    return candidates.filter((element, index, list) => {
      return !list.some((other, otherIndex) => otherIndex < index && other.contains(element));
    });
  }

  function getControls(container) {
    return Array.from(container.querySelectorAll("input, textarea, select"))
      .filter((control) => isVisible(control) && !control.disabled && control.getAttribute("aria-disabled") !== "true");
  }

  function findDropdownTrigger(container) {
    const selector = "select, [role='combobox'], [role='button'], [aria-haspopup], [aria-expanded], button, [tabindex], div, span";

    return Array.from(container.querySelectorAll(selector))
      .find((element) => element instanceof HTMLSelectElement || isSafeDropdownTrigger(element)) || null;
  }

  function isSafeDropdownTrigger(element) {
    if (!element || !(element instanceof Element) || !isVisible(element) || shouldNeverClick(element)) {
      return false;
    }

    if (element instanceof HTMLSelectElement) {
      return true;
    }

    const role = normalize(element.getAttribute("role") || "");
    const ariaHasPopup = normalize(element.getAttribute("aria-haspopup") || "");
    const attrText = normalize([
      element.id || "",
      element.className || "",
      element.getAttribute("data-testid") || "",
      element.getAttribute("data-test") || "",
      element.getAttribute("data-qa") || "",
      element.getAttribute("aria-label") || "",
      cleanText(element, 120)
    ].join(" "));

    if (role === "combobox" || role === "button") {
      return true;
    }

    if (ariaHasPopup === "listbox" || ariaHasPopup === "menu" || element.hasAttribute("aria-expanded")) {
      return true;
    }

    if (element.tagName === "BUTTON") {
      return /select|choose|dropdown|combobox|listbox|caret|arrow|chevron/.test(attrText);
    }

    if ((element.tagName === "DIV" || element.tagName === "SPAN") && /\b(select|choose|dropdown|combobox|listbox|select\.\.\.)\b|▾|▿|▼|⌄/.test(attrText)) {
      return true;
    }

    return false;
  }

  function fillSelect(select, key, value) {
    const options = Array.from(select.options);
    const option = findMatchingOption(options, key, value);

    if (!option) {
      return false;
    }

    setNativeValue(select, option.value);
    option.selected = true;
    dispatchInputAndChange(select);
    return true;
  }

  function findMatchingOption(options, key, value) {
    return options.find((option) => optionMatches(cleanOptionText(option), key, value, true)) ||
      options.find((option) => optionMatches(cleanOptionText(option), key, value, false)) || null;
  }

  function findMatchingVisibleOption(key, value) {
    const candidates = Array.from(document.querySelectorAll("[role='option'], [role='menuitem'], li, button, div, span"))
      .filter((element) => isVisible(element) && !shouldNeverClick(element) && isOptionLike(element));

    return candidates.find((element) => optionMatches(getOptionText(element), key, value, true)) ||
      candidates.find((element) => optionMatches(getOptionText(element), key, value, false)) || null;
  }

  function optionMatches(optionText, key, value, exactOnly) {
    const option = normalize(optionText);
    const aliases = getAliases(key, value).map(normalize).filter(Boolean);

    if (!option || !aliases.length) {
      return false;
    }

    if (aliases.some((alias) => option === alias)) {
      return true;
    }

    if (exactOnly) {
      return false;
    }

    return aliases.some((alias) => {
      if (alias.length <= 2) {
        return new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(option);
      }

      return option.includes(alias) || alias.includes(option);
    });
  }

  function getAliases(key, value) {
    const saved = clean(value);
    const aliases = [saved];

    if (key === "degree" && DEGREE_ALIASES[saved]) {
      aliases.push(...DEGREE_ALIASES[saved]);
    }

    if (key === "discipline" && DISCIPLINE_ALIASES[saved]) {
      aliases.push(...DISCIPLINE_ALIASES[saved]);
    }

    if (key === "schoolName") {
      aliases.push(saved.replace(/\bUniversity\b/i, "Univ"));
    }

    return unique(aliases);
  }

  function findVisibleSearchInput() {
    return Array.from(document.querySelectorAll("input[type='search'], input[role='combobox'], input, textarea"))
      .find((input) => isVisible(input) && !input.disabled && !input.readOnly && !shouldNeverClick(input)) || null;
  }

  function dropdownHasSelection(element, key) {
    const text = normalize(cleanText(element, 160));

    if (!text || /^(select|select one|select\.\.\.|choose|choose one|please select)$/i.test(text)) {
      return false;
    }

    if (key === "schoolName") {
      return !/select/i.test(text);
    }

    return getAliases(key, text).some((alias) => optionMatches(text, key, alias, false));
  }

  function selectHasSelection(select) {
    const option = select.selectedOptions && select.selectedOptions[0];
    return Boolean(clean(select.value) || (option && option.index > 0 && clean(option.textContent)));
  }

  function shouldOverwriteText(input, overwrite) {
    return overwrite || !clean(input.value);
  }

  function isTextInput(control) {
    if (control instanceof HTMLTextAreaElement) {
      return true;
    }

    if (!(control instanceof HTMLInputElement)) {
      return false;
    }

    const type = (control.type || "text").toLowerCase();
    return !["button", "checkbox", "color", "file", "hidden", "image", "password", "radio", "range", "reset", "submit"].includes(type);
  }

  function isOptionLike(element) {
    const role = normalize(element.getAttribute("role") || "");
    const parentRole = normalize(element.parentElement ? element.parentElement.getAttribute("role") || "" : "");
    const attr = normalize([
      element.id || "",
      element.className || "",
      element.getAttribute("data-testid") || "",
      element.getAttribute("data-test") || "",
      element.getAttribute("data-qa") || ""
    ].join(" "));

    if (["option", "menuitem", "treeitem"].includes(role)) {
      return true;
    }

    if (["listbox", "menu", "tree"].includes(parentRole)) {
      return true;
    }

    if (element.tagName === "LI") {
      return true;
    }

    return /option|choice|menu\s*item|select\s*option/.test(attr);
  }

  function safeClick(element) {
    if (shouldNeverClick(element)) {
      console.warn("Blocked unsafe education autofill click.", { text: cleanText(element, 120) });
      return false;
    }

    if (typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ block: "center", inline: "nearest" });
    }

    if (typeof element.focus === "function") {
      element.focus();
    }

    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    element.click();
    return true;
  }

  function shouldNeverClick(element) {
    if (!element || !(element instanceof Element)) {
      return true;
    }

    const link = element.closest("a[href]");
    const text = normalize([
      element.textContent || "",
      element.getAttribute("aria-label") || "",
      element.getAttribute("title") || "",
      link ? link.getAttribute("href") || "" : ""
    ].join(" "));

    return Boolean(link) || BLOCKED_CLICK_PATTERN.test(text);
  }

  function closeDropdown(element) {
    const options = { bubbles: true, cancelable: true, key: "Escape", code: "Escape" };
    element.dispatchEvent(new KeyboardEvent("keydown", options));
    document.dispatchEvent(new KeyboardEvent("keydown", options));

    if (typeof element.blur === "function") {
      element.blur();
    }
  }

  function getFieldContainerText(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("a[href], script, style, input, textarea, select, option, button").forEach((node) => node.remove());
    return clean([clone.textContent || "", element.getAttribute("aria-label") || "", element.getAttribute("data-qa") || "", element.getAttribute("data-testid") || ""].join(" "));
  }

  function getOptionText(element) {
    return clean([
      cleanText(element, 240),
      typeof element.value === "string" ? element.value : "",
      element.getAttribute("aria-label") || "",
      element.getAttribute("data-value") || "",
      element.getAttribute("title") || ""
    ].join(" "));
  }

  function cleanOptionText(option) {
    return clean([option.textContent || "", option.value || ""].join(" "));
  }

  function cleanText(element, limit = 240) {
    if (!element) {
      return "";
    }

    const clone = element.cloneNode(true);
    clone.querySelectorAll("a[href], script, style").forEach((node) => node.remove());
    return limitText(clone.innerText || clone.textContent || "", limit);
  }

  function scoreContainer(element) {
    const rect = element.getBoundingClientRect();
    const controls = element.querySelectorAll("input, textarea, select, button, [role='combobox'], [aria-haspopup], [aria-expanded]").length;
    return Math.max(0, rect.width * rect.height) + controls * 500;
  }

  function setNativeValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  }

  function dispatchInputAndChange(element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function isVisible(element) {
    if (!element || !(element instanceof Element)) {
      return false;
    }

    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0 && rect.height > 0;
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return clean(value)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_./-]+/g, " ")
      .replace(/[?*:()[\]{}'’]+/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function limitText(value, limit) {
    const text = clean(value);
    return text.length > limit ? text.slice(0, limit) : text;
  }

  function unique(values) {
    const seen = new Set();
    return values.map(clean).filter((value) => {
      const key = normalize(value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
})();
