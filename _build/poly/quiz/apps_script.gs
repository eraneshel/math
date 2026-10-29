// Google Apps Script: מקבל מהאתר את תוצאות הבוחן וכותב שורה לכל תלמיד (מתעדכנת בכל שינוי תשובה ובהגשה) + גיליון ניתוח לכל סעיף.
// פריסה: גיליון חדש > הרחבות > Apps Script > הדביקו > פריסה > פריסה חדשה > אפליקציית אינטרנט (הפעלה בשם: אני, גישה: כל אחד) > העתיקו את כתובת ה-URL.
var IDS = ['a1','a2','a3','a4','k','b','c','d','e','f','g','h','i'];
var FIRST = 8; // עמודת התוצאה של הסעיף הראשון; לכל סעיף 3 עמודות: תוצאה, תשובה, עריכות
function col(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - m) / 26); } return s; }
function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents), ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('תוצאות') || ss.insertSheet('תוצאות');
    if (sh.getLastRow() === 0) {
      var h = ['מזהה', 'שם', 'עודכן', 'סטטוס', 'ציון', 'ענו', 'זמן (שניות)'];
      IDS.forEach(function (i) { h.push(i + ' תוצאה', i + ' תשובה', i + ' עריכות'); });
      sh.appendRow(h); sh.setFrozenRows(1); analysis(ss);
    }
    var row = [d.sid, d.name, new Date(), d.status, d.score, d.answered, d.usedSec];
    IDS.forEach(function (i) { var a = (d.ans || {})[i] || {}; row.push(a.ok === undefined ? '' : a.ok, a.v === undefined ? '' : a.v, a.edits === undefined ? '' : a.edits); });
    var f = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).createTextFinder(String(d.sid)).matchEntireCell(true).findNext();
    if (f) sh.getRange(f.getRow(), 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally { lock.releaseLock(); }
}
function analysis(ss) {
  var a = ss.getSheetByName('ניתוח') || ss.insertSheet('ניתוח'); a.clear();
  a.appendRow(['סעיף', 'הגישו', 'נכון (כולל נגרר)', '% נכון', 'ממוצע עריכות']);
  IDS.forEach(function (id, n) {
    var c = col(FIRST + n * 3), e = col(FIRST + n * 3 + 2), r = a.getLastRow() + 1;
    a.appendRow([id,
      '=COUNTIF(תוצאות!D2:D,"הוגש")+COUNTIF(תוצאות!D2:D,"פג זמן")',
      '=COUNTIFS(תוצאות!D2:D,"<>פתוח",תוצאות!' + c + '2:' + c + ',"1")+COUNTIFS(תוצאות!D2:D,"<>פתוח",תוצאות!' + c + '2:' + c + ',"F")',
      '=IF(B' + r + '=0,"",C' + r + '/B' + r + ')',
      '=IFERROR(AVERAGE(תוצאות!' + e + '2:' + e + '),"")']);
  });
  a.setFrozenRows(1);
}
function doGet() { return ContentService.createTextOutput('ok'); }
