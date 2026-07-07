const STORAGE_KEY = "applications";
const CSV_COLUMNS = [
  "title",
  "company",
  "application_url",
  "applied_at",
  "status",
  "source",
  "notes"
];

let applications = [];

document.addEventListener("DOMContentLoaded", () => {
  populateStatusFilter();
  bindEvents();
  loadApplications();
});

function bindEvents() {
  document.getElementById("searchInput").addEventListener("input", renderApplications);
  document.getElementById("statusFilter").addEventListener("change", renderApplications);
  document.getElementById("exportCsvButton").addEventListener("click", exportCsv);
  document.getElementById("exportJsonButton").addEventListener("click", exportJson);
  document.getElementById("importJsonButton").addEventListener("click", () => {
    document.getElementById("importJsonInput").click();
  });
  document.getElementById("importJsonInput").addEventListener("change", importJson);
  document.getElementById("applicationsTableBody").addEventListener("click", handleTableClick);
  document.getElementById("applicationsTableBody").addEventListener("change", handleTableChange);
}

function populateStatusFilter() {
  const statusFilter = document.getElementById("statusFilter");
  statusFilter.textContent = "";
  statusFilter.append(createOption("", "All statuses"));

  ApplicationTracker.APPLICATION_STATUSES.forEach((status) => {
    statusFilter.append(createOption(status, status));
  });
}

async function loadApplications() {
  try {
    const stored = await chrome.storage.local.get([STORAGE_KEY]);
    applications = Array.isArray(stored[STORAGE_KEY])
      ? stored[STORAGE_KEY].map((application) => ApplicationTracker.normalizeApplicationRecord(application))
      : [];
    renderApplications();
    setMessage("");
  } catch (error) {
    setMessage(getErrorMessage(error), true);
  }
}

async function saveApplications(nextApplications) {
  applications = nextApplications.map((application) => ApplicationTracker.normalizeApplicationRecord(application));
  await chrome.storage.local.set({ [STORAGE_KEY]: applications });
  renderApplications();
}

function renderApplications() {
  const tbody = document.getElementById("applicationsTableBody");
  const table = document.getElementById("applicationsTable");
  const emptyState = document.getElementById("emptyState");
  const visibleApplications = getVisibleApplications();

  tbody.textContent = "";
  visibleApplications.forEach((application) => {
    tbody.append(createApplicationRow(application));
  });

  table.hidden = visibleApplications.length === 0;
  emptyState.hidden = visibleApplications.length !== 0;
  emptyState.textContent = applications.length === 0
    ? "No applications recorded yet."
    : "No applications match your filters.";
  updateRecordCount(visibleApplications.length);
}

function getVisibleApplications() {
  const query = normalizeSearchText(document.getElementById("searchInput").value);
  const status = document.getElementById("statusFilter").value;

  return applications.filter((application) => {
    if (status && application.status !== status) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      application.title,
      application.company,
      application.application_url,
      application.status,
      application.notes
    ].some((value) => normalizeSearchText(value).includes(query));
  });
}

function createApplicationRow(application) {
  const row = document.createElement("tr");
  row.dataset.id = application.id;

  appendTextCell(row, application.title, "title-cell");
  appendTextCell(row, application.company, "company-cell");
  appendUrlCell(row, application.application_url);
  appendTextCell(row, formatDate(application.applied_at), "date-cell");
  appendStatusCell(row, application);
  appendTextCell(row, application.source || "-", "source-cell");
  appendTextCell(row, application.notes || "-", application.notes ? "notes-cell" : "notes-cell muted");
  appendActionsCell(row);

  return row;
}

function appendTextCell(row, value, className) {
  const cell = document.createElement("td");
  cell.className = className || "";
  cell.textContent = value || "";
  row.append(cell);
}

function appendUrlCell(row, value) {
  const cell = document.createElement("td");

  if (value) {
    const link = document.createElement("a");
    link.href = value;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "url-link";
    link.title = value;
    link.textContent = value;
    cell.append(link);
  } else {
    cell.textContent = "-";
    cell.className = "muted";
  }

  row.append(cell);
}

function appendStatusCell(row, application) {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  select.dataset.action = "change-status";

  ApplicationTracker.APPLICATION_STATUSES.forEach((status) => {
    select.append(createOption(status, status));
  });

  select.value = application.status;
  cell.append(select);
  row.append(cell);
}

function appendActionsCell(row) {
  const cell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "row-actions";
  actions.append(
    createActionButton("open-url", "Open URL"),
    createActionButton("edit-notes", "Edit notes"),
    createActionButton("delete", "Delete", "danger")
  );
  cell.append(actions);
  row.append(cell);
}

function createActionButton(action, label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = label;

  if (className) {
    button.className = className;
  }

  return button;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

async function handleTableClick(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const application = getApplicationFromEvent(event);

  if (!application) {
    return;
  }

  if (button.dataset.action === "open-url") {
    await openApplicationUrl(application);
    return;
  }

  if (button.dataset.action === "edit-notes") {
    await editApplicationNotes(application);
    return;
  }

  if (button.dataset.action === "delete") {
    await deleteApplication(application);
  }
}

async function handleTableChange(event) {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement) || target.dataset.action !== "change-status") {
    return;
  }

  const application = getApplicationFromEvent(event);

  if (!application) {
    return;
  }

  await updateApplication(application.id, { status: target.value });
  setMessage("Status updated.", false, true);
}

function getApplicationFromEvent(event) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  const row = event.target.closest("tr[data-id]");
  const id = row && row.dataset.id;

  return applications.find((application) => application.id === id) || null;
}

async function openApplicationUrl(application) {
  if (!application.application_url) {
    setMessage("This application does not have a URL.", true);
    return;
  }

  try {
    await chrome.tabs.create({ url: application.application_url });
  } catch (_error) {
    window.open(application.application_url, "_blank", "noopener,noreferrer");
  }
}

async function editApplicationNotes(application) {
  const nextNotes = prompt("Notes for this application:", application.notes || "");

  if (nextNotes === null) {
    return;
  }

  await updateApplication(application.id, { notes: nextNotes });
  setMessage("Notes updated.", false, true);
}

async function deleteApplication(application) {
  if (!confirm(`Delete ${application.title} at ${application.company}?`)) {
    return;
  }

  const nextApplications = applications.filter((item) => item.id !== application.id);
  await saveApplications(nextApplications);
  setMessage("Application deleted.", false, true);
}

async function updateApplication(id, changes) {
  const now = new Date().toISOString();
  const nextApplications = applications.map((application) => {
    if (application.id !== id) {
      return application;
    }

    return {
      ...application,
      ...changes,
      updated_at: now
    };
  });

  await saveApplications(nextApplications);
}

function exportCsv() {
  const header = CSV_COLUMNS.join(",");
  const rows = applications.map((application) => {
    return CSV_COLUMNS.map((column) => csvEscape(application[column])).join(",");
  });
  const csv = [header, ...rows].join("\n");
  downloadFile(csv, `applications-${getDateStamp()}.csv`, "text/csv;charset=utf-8");
  setMessage("Exported applications as CSV.", false, true);
}

function exportJson() {
  const json = JSON.stringify(applications, null, 2);
  downloadFile(json, `applications-${getDateStamp()}.json`, "application/json;charset=utf-8");
  setMessage("Exported applications as JSON.", false, true);
}

async function importJson(event) {
  const input = event.target;
  const file = input.files && input.files[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedApplications = ApplicationTracker.parseApplicationsJson(text);
    let nextApplications = applications;
    let createdCount = 0;
    let updatedCount = 0;

    importedApplications.forEach((application) => {
      const result = ApplicationTracker.dedupeApplications(nextApplications, application, {
        replaceNotes: true,
        replaceUrl: true
      });

      nextApplications = result.applications;

      if (result.action === "updated") {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }
    });

    await saveApplications(nextApplications);
    setMessage(`Imported ${importedApplications.length} application(s): ${createdCount} new, ${updatedCount} updated.`, false, true);
  } catch (error) {
    setMessage(getErrorMessage(error), true);
  } finally {
    input.value = "";
  }
}

function downloadFile(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value || "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function updateRecordCount(visibleCount) {
  const recordCount = document.getElementById("recordCount");
  const totalCount = applications.length;

  if (visibleCount === totalCount) {
    recordCount.textContent = `${totalCount} application${totalCount === 1 ? "" : "s"}`;
    return;
  }

  recordCount.textContent = `${visibleCount} of ${totalCount} applications`;
}

function normalizeSearchText(value) {
  return String(value || "").toLowerCase();
}

function getDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function setMessage(text, isError = false, isSuccess = false) {
  const message = document.getElementById("trackerMessage");
  message.textContent = text;
  message.classList.toggle("is-error", Boolean(isError));
  message.classList.toggle("is-success", Boolean(isSuccess));
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}
