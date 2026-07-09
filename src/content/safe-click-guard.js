(() => {
  if (window.__localJobAutofillSafeClickGuardInstalled) {
    return;
  }

  window.__localJobAutofillSafeClickGuardInstalled = true;

  const BLOCKED_LINK_PATTERN = /(?:\.pdf(?:$|[?#])|race\s*&\s*ethnicity\s*definitions?|race\s+and\s+ethnicity\s+definitions?|eeo|equal\s+employment|demographic\s+definitions?|definitions?\s+pdf|policy|privacy|terms|notice|learn\s+more|poster|law)/i;

  document.addEventListener("click", (event) => {
    if (event.isTrusted) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest("a[href]");

    if (!link) {
      return;
    }

    const linkText = [
      link.textContent || "",
      link.getAttribute("aria-label") || "",
      link.getAttribute("title") || "",
      link.getAttribute("href") || ""
    ].join(" ");

    if (!BLOCKED_LINK_PATTERN.test(linkText)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    console.warn("Blocked an autofill-generated click on an EEO/policy/PDF link.", {
      href: link.getAttribute("href")
    });
  }, true);
})();
