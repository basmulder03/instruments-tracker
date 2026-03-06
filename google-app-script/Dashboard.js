function rebuildFinanceDashboard() {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    buildFinanceDashboard_();
    auditLog_('REBUILD_DASHBOARD', 'Dashboard_Finance', '', 'Herbouw finance dashboard');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function buildFinanceDashboard_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureDashboardSheet_(ss);

  sheet.clear();
  clearCharts_(sheet);

  sheet.getRange('A1').setValue('Dashboard - Financieel');
  sheet.getRange('A3').setValue('Kerncijfers');
  sheet.getRange('A4').setValue('Totaal aankoopkosten');
  sheet.getRange('A5').setValue('Totaal onderhoudskosten');
  sheet.getRange('A6').setValue('Totale boekwaarde (laatste jaar)');

  sheet.getRange('B4').setFormula('=SUM(Instruments!G2:G)');
  sheet.getRange('B5').setFormula('=SUM(Maintenance!D2:D)');

  var bookValue = computeCurrentBookValue_();
  sheet.getRange('B6').setValue(bookValue);

  sheet.getRange('A8').setValue('Afschrijving per jaar');
  sheet.getRange('A9').setFormula('=QUERY(Depreciation!B:E, "select B, sum(E) where B is not null group by B label sum(E) \"Totale boekwaarde\"", 0)');

  sheet.getRange('A15').setValue('Onderhoud per jaar en categorie');
  sheet.getRange('A16').setFormula('=QUERY(Maintenance!C:F, "select year(Col4), Col1, sum(Col2) where Col4 is not null group by year(Col4), Col1 label sum(Col2) \"Kosten\"", 0)');

  sheet.getRange('A1:B1').setFontWeight('bold');
  sheet.getRange('A3').setFontWeight('bold');
  sheet.getRange('A8').setFontWeight('bold');
  sheet.getRange('A15').setFontWeight('bold');

  var depChartRange = sheet.getRange('A9:B30');
  var depChart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(depChartRange)
    .setPosition(2, 4, 0, 0)
    .setOption('title', 'Boekwaarde per jaar')
    .build();
  sheet.insertChart(depChart);

  var maintChartRange = sheet.getRange('A16:C40');
  var maintChart = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(maintChartRange)
    .setPosition(20, 4, 0, 0)
    .setOption('title', 'Onderhoudskosten per jaar/categorie')
    .build();
  sheet.insertChart(maintChart);
}

function exportFinanceDashboardPdf() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ensureDashboardSheet_(ss);
  if (!sheet) {
    throw new Error('Dashboard Financieel ontbreekt');
  }

  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export'
    + '?format=pdf'
    + '&gid=' + sheet.getSheetId()
    + '&portrait=true&size=A4&fitw=true'
    + '&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false';

  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  });
  var name = 'Dashboard_Finance_' + nowIso_().replace(/[:.]/g, '-') + '.pdf';
  var file = DriveApp.createFile(response.getBlob().setName(name));

  auditLog_('EXPORT_DASHBOARD', 'Dashboard Financieel', file.getId(), 'Export finance dashboard PDF');
  return { ok: true, fileId: file.getId(), fileName: file.getName() };
}

function exportFinanceDashboardPdfUi() {
  var res = exportFinanceDashboardPdf();
  SpreadsheetApp.getUi().alert('PDF gemaakt: ' + res.fileName);
}

function computeCurrentBookValue_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Depreciation');
  if (!sheet || sheet.getLastRow() < 2) return 0;

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var latest = {};
  rows.forEach(function(row) {
    var instrumentId = String(row[0] || '').trim();
    var year = parseInt(row[1], 10);
    var endValue = parseNumber_(row[4]);
    if (!instrumentId || !year) return;
    if (!latest[instrumentId] || year > latest[instrumentId].year) {
      latest[instrumentId] = { year: year, endValue: endValue };
    }
  });

  var total = 0;
  Object.keys(latest).forEach(function(id) {
    total += latest[id].endValue || 0;
  });
  return round2_(total);
}

function ensureDashboardSheet_(ss) {
  var legacy = ss.getSheetByName('Dashboard_Finance');
  var current = ss.getSheetByName('Dashboard Financieel');
  if (!current && legacy) {
    legacy.setName('Dashboard Financieel');
    current = legacy;
  }
  var mid = ss.getSheetByName('Dashboard_Financieel');
  if (!current && mid) {
    mid.setName('Dashboard Financieel');
    current = mid;
  }
  if (!current) {
    current = ss.insertSheet('Dashboard Financieel');
  }
  return current;
}

function clearCharts_(sheet) {
  var charts = sheet.getCharts();
  charts.forEach(function(chart) {
    sheet.removeChart(chart);
  });
}
