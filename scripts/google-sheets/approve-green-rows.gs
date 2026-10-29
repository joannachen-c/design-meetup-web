/**
 * Design Meetup — approve applicants highlighted green in the applications sheet.
 *
 * Any row with a green background (on any cell) has its email sent to the site,
 * which lets that person create a portal account. Sending is safe to repeat,
 * so every run simply resends all green rows.
 *
 * Setup (once, by someone with edit access to the sheet):
 *   1. In the sheet: Extensions → Apps Script, paste this whole file, save.
 *   2. Project Settings → Script Properties → add
 *        MEMBER_APPROVALS_TOKEN = <same value as MEMBER_APPROVALS_TOKEN in Vercel>
 *      Optionally SHEET_NAME = the tab with applications (defaults to the first tab).
 *   3. Run `installTriggers` once from the editor and accept the permissions.
 *      After that it runs when the sheet changes and every 10 minutes.
 *   4. Run `approveGreenRows` and check View → Logs to confirm.
 */

const APPROVALS_URL = "https://designmeetup.info/api/portal/approved-signups";

function approveGreenRows() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("MEMBER_APPROVALS_TOKEN");
  if (!token) throw new Error("Set MEMBER_APPROVALS_TOKEN in Script Properties first.");

  const book = SpreadsheetApp.getActiveSpreadsheet();
  const name = props.getProperty("SHEET_NAME");
  const sheet = name ? book.getSheetByName(name) : book.getSheets()[0];
  if (!sheet) throw new Error(`No tab named "${name}".`);

  const range = sheet.getDataRange();
  const values = range.getDisplayValues();
  const backgrounds = range.getBackgrounds();
  const emailColumn = findEmailColumn(values[0] || []);

  const emails = [];
  for (let row = 1; row < values.length; row++) {
    if (!backgrounds[row].some(isGreen)) continue;
    const email = emailColumn >= 0 ? values[row][emailColumn] : values[row].find(looksLikeEmail);
    if (email && looksLikeEmail(email)) emails.push(email.trim().toLowerCase());
  }
  if (!emails.length) {
    Logger.log("No green rows with an email.");
    return;
  }

  const response = UrlFetchApp.fetch(APPROVALS_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + token },
    payload: JSON.stringify({ emails: [...new Set(emails)] }),
    muteHttpExceptions: true,
  });
  const status = response.getResponseCode();
  if (status !== 200) throw new Error(`Approval failed (${status}): ${response.getContentText()}`);
  const result = JSON.parse(response.getContentText());
  Logger.log(
    `Added ${result.added.length}: ${result.added.join(", ") || "none"} · ` +
      `${result.alreadyApproved.length} already approved · ${result.invalid.length} invalid`,
  );
}

/** Header containing "email" (prefers an exact "Email"), or -1 to scan each row. */
function findEmailColumn(header) {
  const labels = header.map((cell) => String(cell).trim().toLowerCase());
  const exact = labels.indexOf("email");
  if (exact >= 0) return exact;
  return labels.findIndex((label) => label.includes("email"));
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

/** Green-dominant fill: covers Sheets' "light green 1–3", "green" and similar custom greens. */
function isGreen(hex) {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
  if (!match) return false;
  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16));
  return g - r >= 12 && g - b >= 12;
}

function installTriggers() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === "approveGreenRows") ScriptApp.deleteTrigger(trigger);
  }
  // Highlighting a row is a format change, which only onChange (not onEdit) sees.
  ScriptApp.newTrigger("approveGreenRows").forSpreadsheet(book).onChange().create();
  ScriptApp.newTrigger("approveGreenRows").timeBased().everyMinutes(10).create();
  Logger.log("Triggers installed.");
}
