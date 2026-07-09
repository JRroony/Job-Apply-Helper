const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "phoneCountryCode",
  "location",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "countryOfResidence",
  "schoolName",
  "degree",
  "discipline",
  "educationStartYear",
  "educationEndYear",
  "linkedin",
  "github",
  "portfolio",
  "salary",
  "workAuthorization",
  "needSponsorship",
  "relocation",
  "gender",
  "hispanicLatino",
  "race",
  "genderIdentity",
  "racialEthnicBackground",
  "sexualOrientation",
  "transgenderIdentity",
  "disabilityStatus",
  "veteranStatus",
  "coverLetter"
];

const ARRAY_PROFILE_FIELDS = new Set([
  "race",
  "genderIdentity",
  "racialEthnicBackground",
  "sexualOrientation"
]);

const FILL_ACTIVE_TAB = "FILL_ACTIVE_TAB";
const RECORD_CURRENT_JOB = "RECORD_CURRENT_JOB";

let pendingResume = null;
let savedResume = null;

document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById("saveButton");
  const clearButton = document.getElementById("clearButton");
  const refillButton = document.getElementById("refillButton");
  const recordJobButton = document.getElementById("recordJobButton");
  const openTrackerButton = document.getElementById("openTrackerButton");
  const resumeFile = document.getElementById("resumeFile");

  loadStoredData();

  resumeFile.addEventListener("change", handleResumeSelection);
  saveButton.addEventListener("click", saveProfile);
  clearButton.addEventListener("click", clearProfile);
  refillButton.addEventListener("click", refillCurrentPage);
  recordJobButton.addEventListener("click", recordCurrentJob);
  openTrackerButton.addEventListener("click", openApplicationTracker);
});

async function loadStoredData() {
  try {
    const stored = await chrome.storage.local.get(["profile", "resume"]);
    const profile = stored.profile || {};

    PROFILE_FIELDS.forEach((field) => {
      if (ARRAY_PROFILE_FIELDS.has(field)) {
        setCheckboxGroupValues(field, profile[field]);
        return;
      }

      const element = document.getElementById(field);
      if (element) {
        element.value = profile[field] || "";
      }
    });

    savedResume = stored.resume || null;
    pendingResume = null;
    updateResumeStatus();
    setMessage("");
  } catch (error) {
    setMessage(getErrorMessage(error), true);
  }
}

function collectProfile() {
  return PROFILE_FIELDS.reduce((profile, field) => {
    if (ARRAY_PROFILE_FIELDS.has(field)) {
      profile[field] = getCheckboxGroupValues(field);
      return profile;
    }

    const element = document.getElementById(field);
    profile[field] = element ? element.value.trim() : "";
    return profile;
  }, {});
}

function getCheckboxGroupValues(field) {
  return Array.from(document.querySelectorAll(`input[name="${field}"]:checked`))
    .map((input) => input.value)
    .filter(Boolean);
}

function setCheckboxGroupValues(field, value) {
  const values = new Set((Array.isArray(value) ? value : [value]).filter(Boolean));

  document.querySelectorAll(`input[name="${field}"]`).forEach((input) => {
    input.checked = values.has(input.value);
  });
}

async function handleResumeSelection(event) {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    pendingResume = null;
    updateResumeStatus();
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    pendingResume = {
      name: file.name,
      type: file.type || "application/octet-stream",
      dataUrl
    };
    updateResumeStatus();
    setMessage("Resume ready to save.");
  } catch (error) {
    pendingResume = null;
    updateResumeStatus();
    setMessage(getErrorMessage(error), true);
  }
}

async function saveProfile() {
  try {
    const profile = collectProfile();
    const resume = pendingResume || savedResume || null;

    await chrome.storage.local.set({ profile, resume });

    savedResume = resume;
    pendingResume = null;
    document.getElementById("resumeFile").value = "";
    updateResumeStatus();
    setMessage("Saved locally.", false, true);
  } catch (error) {
    setMessage(getErrorMessage(error), true);
  }
}

async function clearProfile() {
  try {
    await chrome.storage.local.remove(["profile", "resume"]);

    PROFILE_FIELDS.forEach((field) => {
      if (ARRAY_PROFILE_FIELDS.has(field)) {
        setCheckboxGroupValues(field, []);
        return;
      }

      const element = document.getElementById(field);
      if (element) {
        element.value = "";
      }
    });

    savedResume = null;
    pendingResume = null;
    document.getElementById("resumeFile").value = "";
    updateResumeStatus();
    setMessage("Cleared local profile data.");
  } catch (error) {
    setMessage(getErrorMessage(error), true);
  }
}

async function refillCurrentPage() {
  setMessage("Filling current page...");

  try {
    const response = await chrome.runtime.sendMessage({ type: FILL_ACTIVE_TAB });
    const result = response || {};

    if (result.error) {
      setMessage(result.error, true);
      return;
    }

    const resumeText = result.resumeAttached ? " Resume attached." : "";
    const trackerText = buildTrackerMessage(result);
    setMessage(`Filled ${result.filledCount || 0} field(s).${resumeText}${trackerText}`, false, true);
  } catch (error) {
    setMessage(getErrorMessage(error), true);
  }
}

function buildTrackerMessage(result) {
  if (result.applicationRecorded) {
    const application = result.application || {};
    const action = result.applicationAction === "updated" ? "Updated" : "Recorded";
    const title = application.title || "current job";
    const companyText = application.company ? ` at ${application.company}` : "";

    return ` ${action} ${title}${companyText} in tracker.`;
  }

  if (result.applicationRecordError) {
    return ` Tracker not updated: ${result.applicationRecordError}`;
  }

  return "";
}

async function recordCurrentJob() {
  const recordJobButton = document.getElementById("recordJobButton");
  setMessage("Recording current job...");
  recordJobButton.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({ type: RECORD_CURRENT_JOB });
    const result = response || {};

    if (!result.ok || result.error) {
      setMessage(result.error || "Could not record this job.", true);
      return;
    }

    const application = result.application || {};
    const action = result.action === "updated" ? "Updated" : "Recorded";
    const companyText = application.company ? ` at ${application.company}` : "";
    setMessage(`${action} ${application.title || "current job"}${companyText}.`, false, true);
  } catch (error) {
    setMessage(getErrorMessage(error), true);
  } finally {
    recordJobButton.disabled = false;
  }
}

async function openApplicationTracker() {
  const trackerUrl = chrome.runtime.getURL("src/tracker/jobs.html");

  try {
    await chrome.tabs.create({ url: trackerUrl });
  } catch (_error) {
    window.open(trackerUrl, "_blank", "noopener,noreferrer");
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read resume file."));
    reader.readAsDataURL(file);
  });
}

function updateResumeStatus() {
  const resumeStatus = document.getElementById("resumeStatus");
  const resume = pendingResume || savedResume;

  if (!resume) {
    resumeStatus.textContent = "No resume saved.";
    return;
  }

  const prefix = pendingResume ? "Selected" : "Saved";
  resumeStatus.textContent = `${prefix} resume: ${resume.name || "resume file"}`;
}

function setMessage(text, isError = false, isSuccess = false) {
  const message = document.getElementById("message");
  message.textContent = text;
  message.classList.toggle("is-error", Boolean(isError));
  message.classList.toggle("is-success", Boolean(isSuccess));
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}
