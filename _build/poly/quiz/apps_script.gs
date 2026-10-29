// Google Apps Script: מקבל תוצאות בוחן מהאתר וכותב שורה אחת לכל תלמיד (מתעדכנת בכל תשובה).
// פריסה: גיליון חדש > תוספים > Apps Script > הדביקו > פריסה > פריסה חדשה > אפליקציית אינטרנט (הפעלה בשם: אני, גישה: כל אחד) > העתיקו את כתובת ה-URL.
var IDS = ['a1','a2','a3','a4','k','b','c','d','e','f','g','h','i'];
function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('תוצאות') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('תוצאות');
    if (sh.getLastRow() === 0) {
      var h = ['מזהה', 'שם', 'עודכן', 'ציון', 'ענו', 'זמן כולל (שניות)'];
      IDS.forEach(function (i) { h.push(i + ' תוצאה', i + ' תשובה', i + ' שניות'); });
      sh.appendRow(h); sh.setFrozenRows(1);
    }
    var row = [d.sid, d.name, new Date(), d.score, d.answered, d.totalSec];
    IDS.forEach(function (i) { var a = (d.ans || {})[i] || {}; row.push(a.ok === undefined ? '' : a.ok, a.v === undefined ? '' : a.v, a.sec === undefined ? '' : a.sec); });
    var f = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).createTextFinder(String(d.sid)).matchEntireCell(true).findNext();
    if (f) sh.getRange(f.getRow(), 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally { lock.releaseLock(); }
}
function doGet() { return ContentService.createTextOutput('ok'); }
