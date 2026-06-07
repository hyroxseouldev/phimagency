const SPREADSHEET_ID = "1VqB0qy-r7ZDdlgS99TGGl84e0RQD3V60hJj4_o5sSck";
const SHEET_NAME = "Contact Submissions";
const HEADERS = [
  "submittedAt",
  "name",
  "phone",
  "company",
  "category",
  "service",
  "budget",
  "message",
  "pageUrl",
  "userAgent",
];

function doPost(e) {
  const params = e && e.parameter ? e.parameter : {};

  if (params.website) {
    return jsonResponse({ ok: true, ignored: true });
  }

  const requiredFields = ["name", "phone", "service"];
  const missingFields = requiredFields.filter(function (field) {
    return !String(params[field] || "").trim();
  });

  if (missingFields.length > 0) {
    return jsonResponse({ ok: false, missingFields: missingFields });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSubmissionSheet();
    sheet.appendRow([
      new Date(),
      params.name || "",
      params.phone || "",
      params.company || "",
      params.category || "",
      params.service || "",
      params.budget || "",
      params.message || "",
      params.pageUrl || "",
      params.userAgent || "",
    ]);
  } finally {
    lock.releaseLock();
  }

  return jsonResponse({ ok: true });
}

function doGet() {
  return jsonResponse({ ok: true, service: "PHIM STUDIO contact form" });
}

function getSubmissionSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaders = HEADERS.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (needsHeaders) {
    headerRange.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
