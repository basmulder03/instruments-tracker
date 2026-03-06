function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Instrument Tracker')
    .addItem('Instrument toevoegen', 'showAddInstrumentSidebar')
    .addItem('Persoon toevoegen', 'showAddPersonSidebar')
    .addItem('Locatie toevoegen', 'showAddLocationSidebar')
    .addItem('Checkout instrument', 'showCheckoutSidebar')
    .addItem('Return instrument', 'showReturnSidebar')
    .addItem('Onderhoud toevoegen', 'showMaintenanceSidebar')
    .addItem('Gebruik loggen', 'showUsageSidebar')
    .addItem('Historie bekijken', 'showHistorySidebar')
    .addItem('Herbouw analyses', 'showRebuildSidebar')
    .addItem('Dashboard en export', 'showDashboardSidebar')
    .addItem('Audit zijbalk', 'showAuditSidebar')
    .addSeparator()
    .addItem('Setup tabbladen', 'setupTrackerSheets')
    .addItem('Demo-data laden', 'seedDemoDataUi')
    .addItem('Alle data wissen', 'clearAllDataUi')
    .addItem('Verifieer auditketen', 'showAuditVerification')
    .addToUi();
}

function showAddInstrumentSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarAddInstrument')
    .setTitle('Instrument Tracker - Instrument');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showAddPersonSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarAddPerson')
    .setTitle('Instrument Tracker - Persoon');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showAddLocationSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarAddLocation')
    .setTitle('Instrument Tracker - Locatie');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showAuditSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarAudit')
    .setTitle('Instrument Tracker - Audit');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showCheckoutSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarCheckout')
    .setTitle('Instrument Tracker - Checkout');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showReturnSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarReturn')
    .setTitle('Instrument Tracker - Return');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showMaintenanceSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarMaintenance')
    .setTitle('Instrument Tracker - Onderhoud');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showUsageSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarUsage')
    .setTitle('Instrument Tracker - Gebruik');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showHistorySidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarHistory')
    .setTitle('Instrument Tracker - Historie');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showRebuildSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarRebuild')
    .setTitle('Instrument Tracker - Analyses');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showDashboardSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('SidebarDashboard')
    .setTitle('Instrument Tracker - Dashboard');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showAuditVerification() {
  var result = verifyAuditChain();
  var msg = result.ok
    ? 'Auditketen OK.'
    : 'Auditketen fout op rij ' + result.row + ': ' + result.error;
  SpreadsheetApp.getUi().alert(msg);
}

function seedDemoDataUi() {
  var res = seedDemoData();
  SpreadsheetApp.getUi().alert('Demo-data klaar. Seeded: ' + res.seeded.join(', ') + ' | Overgeslagen: ' + res.skipped.join(', '));
}

function clearAllDataUi() {
  var res = clearAllData();
  SpreadsheetApp.getUi().alert('Alle data is gewist.');
}
