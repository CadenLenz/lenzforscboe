/** Paste into a bound Google Apps Script project. Configure Script Properties; see docs/ENDORSEMENTS.md. */
function doPost(e) {
  const reply = ok => ContentService.createTextOutput(JSON.stringify({ok:ok})).setMimeType(ContentService.MimeType.JSON);
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 12000) return reply(false);
    const envelope = JSON.parse(e.postData.contents);
    if (typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.signature)) return reply(false);
    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty('SHEETS_SIGNING_SECRET');
    if (!secret || secret.length < 32) return reply(false);
    const expected = Utilities.computeHmacSha256Signature(envelope.payload, secret, Utilities.Charset.UTF_8)
      .map(byte => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('');
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ envelope.signature.charCodeAt(i);
    if (difference !== 0) return reply(false);
    const data = JSON.parse(envelope.payload);
    const age = Date.now() - Date.parse(data.timestamp);
    if (!Number.isFinite(age) || age < -30000 || age > 300000 || !/^[a-f0-9-]{36}$/.test(data.nonce)) return reply(false);
    if (data.consent !== true || data.status !== 'Pending') return reply(false);
    const limits = {name:120, affiliation:180, email:254};
    for (const field of Object.keys(limits)) {
      if (typeof data[field] !== 'string' || data[field].length > limits[field] || /[\u0000-\u001f\u007f]/.test(data[field])) return reply(false);
    }
    if (!data.name.trim() || (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) return reply(false);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return reply(false);
    const sheet = SpreadsheetApp.openById(properties.getProperty('SHEET_ID')).getSheetByName('Endorsements');
    if (!sheet) return reply(false);
    // Keep a non-personal submission ID in column G to prevent replay, including after cache eviction.
    const existing = sheet.getRange('G:G').createTextFinder(data.nonce).matchEntireCell(true).findNext();
    if (existing) return reply(true);
    // Neutralize spreadsheet formulas. Never interpret a submitted name as a formula.
    const safeCell = value => /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
    sheet.appendRow([data.timestamp, safeCell(data.name), safeCell(data.affiliation), safeCell(data.email), 'Yes', 'Pending', data.nonce]);
    return reply(true);
  } catch (_) { return reply(false); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}

/** Run once after setting SHEET_ID. Preserves an existing populated tab. */
function setupSheet() {
  const spreadsheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  const sheet = spreadsheet.getSheetByName('Endorsements') || spreadsheet.insertSheet('Endorsements');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp','Name','Affiliation','Email','Consent','Moderation Status','Submission ID']);
    sheet.setFrozenRows(1);
    sheet.getRange('A:G').setNumberFormat('@');
  }
}
