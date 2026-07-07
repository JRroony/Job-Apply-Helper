importScripts("../shared/applications.js");

const FILL_ACTIVE_TAB = "FILL_ACTIVE_TAB";
const FILL_FORM = "FILL_FORM";
const RECORD_CURRENT_JOB = "RECORD_CURRENT_JOB";
const EXTRACT_JOB_INFO = "EXTRACT_JOB_INFO";

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
          error: error && error.message ? error.message : String(error)
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
          error: error && error.message ? error.message : String(error)
        });
      });

    return true;
  }

  return false;
});

async function fillActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || typeof tab.id !== "number") {
    return {
      filledCount: 0,
      resumeAttached: false,
      error: "No active tab was found."
    };
  }

  if (!tab.url || !/^https?:\/\//i.test(tab.url)) {
    return {
      filledCount: 0,
      resumeAttached: false,
      error: "This extension can only fill regular http/https pages."
    };
  }

  const stored = await chrome.storage.local.get(["profile", "resume"]);
  const payload = {
    type: FILL_FORM,
    profile: stored.profile || {},
    resume: stored.resume || null,
    overwrite: true
  };

  try {
    return await sendFillMessage(tab.id, payload);
  } catch (firstError) {
    const message = firstError && firstError.message ? firstError.message : String(firstError);

    if (!/receiving end does not exist|could not establish connection/i.test(message)) {
      throw firstError;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content/content.js"]
    });

    return sendFillMessage(tab.id, payload);
  }
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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || typeof tab.id !== "number") {
    return {
      ok: false,
      error: "No active tab was found."
    };
  }

  if (!tab.url || !/^https?:\/\//i.test(tab.url)) {
    return {
      ok: false,
      error: "This extension can only record regular http/https pages."
    };
  }

  const payload = { type: EXTRACT_JOB_INFO };
  let response;

  try {
    response = await sendJobInfoMessage(tab.id, payload);
  } catch (firstError) {
    const message = firstError && firstError.message ? firstError.message : String(firstError);

    if (!/receiving end does not exist|could not establish connection|did not return job info/i.test(message)) {
      throw firstError;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content/content.js"]
    });

    response = await sendJobInfoMessage(tab.id, payload);
  }

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
  const application = ApplicationTracker.createApplicationRecord(jobInfo, { status: "applied" });
  const stored = await chrome.storage.local.get(["applications"]);
  const result = ApplicationTracker.dedupeApplications(stored.applications || [], application);

  await chrome.storage.local.set({ applications: result.applications });

  return {
    ok: true,
    action: result.action,
    application: result.application
  };
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
