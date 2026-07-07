const FILL_ACTIVE_TAB = "FILL_ACTIVE_TAB";
const FILL_FORM = "FILL_FORM";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== FILL_ACTIVE_TAB) {
    return false;
  }

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
      files: ["content.js"]
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
