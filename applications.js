(() => {
  const APPLICATION_STATUSES = [
    "saved",
    "applied",
    "interview",
    "rejected",
    "offer",
    "stale"
  ];

  const TRACKING_PARAMS = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "gh_src",
    "source",
    "ref"
  ]);

  function normalizeApplicationUrl(value) {
    const rawUrl = cleanString(value);

    if (!rawUrl) {
      return "";
    }

    try {
      const url = new URL(rawUrl);
      const entries = Array.from(url.searchParams.entries())
        .filter(([key]) => !TRACKING_PARAMS.has(key.toLowerCase()))
        .sort(([firstKey, firstValue], [secondKey, secondValue]) => {
          return `${firstKey}=${firstValue}`.localeCompare(`${secondKey}=${secondValue}`);
        });

      url.search = "";
      entries.forEach(([key, itemValue]) => {
        url.searchParams.append(key, itemValue);
      });

      return url.href;
    } catch (_error) {
      return rawUrl;
    }
  }

  function createApplicationRecord(jobInfo, options = {}) {
    const now = options.now || new Date().toISOString();

    return normalizeApplicationRecord({
      id: createId(),
      title: jobInfo && jobInfo.title,
      company: jobInfo && jobInfo.company,
      application_url: jobInfo && jobInfo.application_url,
      applied_at: now,
      status: options.status || "applied",
      source: jobInfo && jobInfo.source,
      notes: "",
      created_at: now,
      updated_at: now
    });
  }

  function normalizeApplicationRecord(application, options = {}) {
    const now = options.now || new Date().toISOString();
    const status = cleanString(application && application.status);

    return {
      id: cleanString(application && application.id) || createId(),
      title: cleanString(application && application.title) || "Untitled role",
      company: cleanString(application && application.company) || "Unknown company",
      application_url: cleanString(application && application.application_url),
      applied_at: cleanString(application && application.applied_at) || now,
      status: APPLICATION_STATUSES.includes(status) ? status : "saved",
      source: cleanString(application && application.source),
      notes: cleanMultilineString(application && application.notes),
      created_at: cleanString(application && application.created_at) || now,
      updated_at: cleanString(application && application.updated_at) || now
    };
  }

  function dedupeApplications(applications, newApplication, options = {}) {
    const normalizedApplications = Array.isArray(applications)
      ? applications.map((application) => normalizeApplicationRecord(application))
      : [];
    const incoming = normalizeApplicationRecord(newApplication);
    const incomingUrl = normalizeApplicationUrl(incoming.application_url);
    let action = "created";
    let savedApplication = incoming;

    if (!incomingUrl) {
      return {
        action,
        application: savedApplication,
        applications: [...normalizedApplications, savedApplication]
      };
    }

    const updatedApplications = normalizedApplications.map((application) => {
      const existingUrl = normalizeApplicationUrl(application.application_url);

      if (action === "updated" || existingUrl !== incomingUrl) {
        return application;
      }

      action = "updated";
      savedApplication = {
        ...application,
        title: incoming.title || application.title,
        company: incoming.company || application.company,
        application_url: options.replaceUrl ? incoming.application_url : application.application_url || incoming.application_url,
        applied_at: incoming.applied_at || application.applied_at,
        status: incoming.status || application.status,
        source: incoming.source || application.source,
        notes: options.replaceNotes ? incoming.notes : application.notes,
        updated_at: incoming.updated_at || new Date().toISOString()
      };

      return savedApplication;
    });

    if (action === "updated") {
      return {
        action,
        application: savedApplication,
        applications: updatedApplications
      };
    }

    return {
      action,
      application: savedApplication,
      applications: [...updatedApplications, savedApplication]
    };
  }

  function parseApplicationsJson(value) {
    const parsed = JSON.parse(value);
    const records = Array.isArray(parsed) ? parsed : parsed && parsed.applications;

    if (!Array.isArray(records)) {
      throw new Error("JSON import must be an array or an object with an applications array.");
    }

    return records.map((record) => normalizeApplicationRecord(record));
  }

  function createId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }

    return `application-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function cleanString(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function cleanMultilineString(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim();
  }

  const api = {
    APPLICATION_STATUSES,
    createApplicationRecord,
    dedupeApplications,
    normalizeApplicationRecord,
    normalizeApplicationUrl,
    parseApplicationsJson
  };

  globalThis.ApplicationTracker = api;
})();
