importScripts("../shared/applications.js");

const FILL_ACTIVE_TAB = "FILL_ACTIVE_TAB";
const FILL_FORM = "FILL_FORM";
const RECORD_CURRENT_JOB = "RECORD_CURRENT_JOB";
const EXTRACT_JOB_INFO = "EXTRACT_JOB_INFO";
const APPLICATIONS_STORAGE_KEY = "applications";
const CONTENT_SCRIPT_FILES = [
  "src/content/safe-click-guard.js",
  "src/content/content-safe.js"
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message) {
    return false;
  }

  if (message.type === FILL_ACTIVE_TAB) {
    fillActiveTab()
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

  if (message.type === RECORD_CURRENT_JOB) {
    recordCurrentJob()
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          ok: false,
          error: getErrorMessage(error)
        });
      });

    return true;
  }

  return false;
});

async function fillActiveTab() {
  const tab = await getActiveHttpTab("This extension can only fill regular http/https pages.");
  const stored = await chrome.storage.local.get(["profile", "resume"]);
  const payload = {
    type: FILL_FORM,
    profile: stored.profile || {},
    resume: stored.resume || null,
    overwrite: true
  };

  let fillResult;

  try {
    fillResult = await sendFillMessage(tab.id, payload);
  } catch (firstError) {
    const message = getErrorMessage(firstError);

    if (!isMissingContentScriptError(message)) {
      throw firstError;
    }

    await injectContentScripts(tab.id);
    fillResult = await sendFillMessage(tab.id, payload);
  }

  if (fillResult && !fillResult.error) {
    const recordResult = await recordApplicationFromTab(tab, { status: "applied" })
      .catch((error) => ({
        ok: false,
        error: getErrorMessage(error)
      }));

    return {
      ...fillResult,
      applicationRecorded: Boolean(recordResult.ok),
      applicationAction: recordResult.action || null,
      application: recordResult.application || null,
      applicationRecordError: recordResult.ok ? null : recordResult.error || "Could not record this application."
    };
  }

  return fillResult;
}

function sendFillMessage(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }

      resolve(response || {
        filledCount: 0,
        resumeAttached: false,
        error: "The page did not return a fill result."
      });
    });
  });
}

async function recordCurrentJob() {
  const tab = await getActiveHttpTab("This extension can only record regular http/https pages.");
  return recordApplicationFromTab(tab, { status: "applied" });
}

async function recordApplicationFromTab(tab, options = {}) {
  const response = await getJobInfoFromTab(tab);

  if (response.error) {
    return {
      ok: false,
      error: response.error
    };
  }

  const jobInfo = {
    ...(response.jobInfo || {}),
    application_url: (response.jobInfo && response.jobInfo.application_url) || tab.url
  };
  const application = ApplicationTracker.createApplicationRecord(jobInfo, {
    status: options.status || "applied"
  });
  const stored = await chrome.storage.local.get([APPLICATIONS_STORAGE_KEY]);
  const result = ApplicationTracker.dedupeApplications(stored[APPLICATIONS_STORAGE_KEY] || [], application);

  await chrome.storage.local.set({ [APPLICATIONS_STORAGE_KEY]: result.applications });

  return {
    ok: true,
    action: result.action,
    application: result.application
  };
}

async function getJobInfoFromTab(tab) {
  const payload = { type: EXTRACT_JOB_INFO };

  try {
    return await sendJobInfoMessage(tab.id, payload);
  } catch (firstError) {
    const message = getErrorMessage(firstError);

    if (!isMissingContentScriptError(message) && !/did not return job info/i.test(message)) {
      throw firstError;
    }

    await injectContentScripts(tab.id);
    return sendJobInfoMessage(tab.id, payload);
  }
}

function sendJobInfoMessage(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }

      if (!response) {
        reject(new Error("The page did not return job info."));
        return;
      }

      resolve(response);
    });
  });
}

async function getActiveHttpTab(nonHttpErrorMessage) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || typeof tab.id !== "number") {
    throw new Error("No active tab was found.");
  }

  if (!tab.url || !/^https?:\/\//i.test(tab.url)) {
    throw new Error(nonHttpErrorMessage);
  }

  return tab;
}

function injectContentScripts(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    files: CONTENT_SCRIPT_FILES
  });
}

function isMissingContentScriptError(message) {
  return /receiving end does not exist|could not establish connection/i.test(message || "");
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}
