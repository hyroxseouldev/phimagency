const SPREADSHEET_ID = "1VqB0qy-r7ZDdlgS99TGGl84e0RQD3V60hJj4_o5sSck";
const SHEET_NAME = "Contact Submissions";
const CONTACT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1VqB0qy-r7ZDdlgS99TGGl84e0RQD3V60hJj4_o5sSck/edit#gid=2048071901";
const SLACK_WEBHOOK_PROPERTY = "SLACK_WEBHOOK_URL";
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

  try {
    sendSlackNotification(params);
  } catch (error) {
    console.error("Slack notification failed", error);
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

function sendSlackNotification(params) {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty(SLACK_WEBHOOK_PROPERTY);

  if (!webhookUrl) {
    console.warn("Missing Slack webhook URL in Script Properties");
    return;
  }

  const payload = {
    text: "새 상담 문의가 접수되었습니다.",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "새 상담 문의가 접수되었습니다.",
        },
      },
      {
        type: "section",
        fields: [
          slackField("이름", params.name),
          slackField("연락처", params.phone),
          slackField("서비스", params.service),
          slackField("예산", params.budget || "미입력"),
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*문의 내용*\n" + truncateForSlack(params.message || "미입력", 700),
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "시트에서 보기",
            },
            url: CONTACT_SHEET_URL,
          },
        ],
      },
    ],
  };

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    console.error("Slack webhook returned " + statusCode + ": " + response.getContentText());
  }
}

function slackField(label, value) {
  return {
    type: "mrkdwn",
    text: "*" + label + "*\n" + (value || "미입력"),
  };
}

function truncateForSlack(value, maxLength) {
  const text = String(value || "");
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 1) + "…";
}
