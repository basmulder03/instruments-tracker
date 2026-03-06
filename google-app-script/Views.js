function applyViewsAndHiding() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  removeLegacyViews_(ss);
  renameLegacyDashboard_(ss);

  var dataSheets = [
    'Instruments',
    'People',
    'Locations',
    'Movements',
    'Maintenance',
    'Usage_Events',
    'AuditLog',
    'Usage_Stats',
    'Maintenance_Predictions',
    'Depreciation'
  ];

  dataSheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      sheet.hideSheet();
    }
  });

  createViewSheet_('Overzicht Instrumenten', masterViewFormula_());
  createViewSheet_('Overzicht Uitgiftes', checkoutViewFormula_());
  createViewSheet_('Overzicht Retouren', returnViewFormula_());
  createViewSheet_('Overzicht Onderhoud', maintenanceViewFormula_());
  createViewSheet_('Overzicht Gebruik', usageViewFormula_());

  protectViewSheets_([
    'Overzicht Instrumenten',
    'Overzicht Uitgiftes',
    'Overzicht Retouren',
    'Overzicht Onderhoud',
    'Overzicht Gebruik',
    'Dashboard Financieel'
  ]);
}

function removeLegacyViews_(ss) {
  var legacy = [
    'View_Instruments',
    'View_People',
    'View_Locations',
    'View_Movements',
    'View_Maintenance',
    'View_Usage',
    'View_Audit',
    'View_Master_Instruments',
    'Overzicht_Instrumenten',
    'Overzicht Instrumenten',
    'Overzicht Uitgiftes',
    'Overzicht Retouren',
    'Overzicht Onderhoud',
    'Overzicht Gebruik'
  ];
  legacy.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) ss.deleteSheet(sheet);
  });
}

function renameLegacyDashboard_(ss) {
  var legacy = ss.getSheetByName('Dashboard_Finance');
  var current = ss.getSheetByName('Dashboard Financieel');
  if (!current && legacy) {
    legacy.setName('Dashboard Financieel');
  }
  var mid = ss.getSheetByName('Dashboard_Financieel');
  if (!current && mid) {
    mid.setName('Dashboard Financieel');
  }
}

function createViewSheet_(name, formula) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  sheet.clear();
  sheet.getRange(1, 1).setFormula(formula);
  sheet.setFrozenRows(1);
}

function masterViewFormula_() {
  return [
    '=IFERROR({',
    '"Naam"\\\"Type\"\\\"Status\"\\\"Locatie\"\\\"Persoon\"\\\"Laatst bijgewerkt\";',
    'FILTER({',
    'Instruments!B2:B\\',
    'Instruments!C2:C\\',
    'Instruments!J2:J\\',
    'IF(Instruments!K2:K<>\"\";VLOOKUP(Instruments!K2:K;Locations!A:B;2;FALSE);\"\")\\',
    'IF(Instruments!L2:L<>\"\";VLOOKUP(Instruments!L2:L;People!A:B;2;FALSE);\"\")\\',
    'Instruments!O2:O',
    '};',
    'Instruments!B2:B<>\"\"',
    ')',
    '};\"\" )'
  ].join('');
}

function checkoutViewFormula_() {
  return [
    '=IFERROR({',
    '"Instrument"\\\"Persoon\"\\\"Locatie\"\\\"Checkout op\"\\\"Status\";',
    'FILTER({',
    'IF(Movements!B2:B<>\"\";VLOOKUP(Movements!B2:B;Instruments!A:B;2;FALSE);\"\")\\',
    'IF(Movements!C2:C<>\"\";VLOOKUP(Movements!C2:C;People!A:B;2;FALSE);\"\")\\',
    'IF(Movements!D2:D<>\"\";VLOOKUP(Movements!D2:D;Locations!A:B;2;FALSE);\"\")\\',
    'Movements!E2:E\\',
    'Movements!H2:H',
    '};',
    'Movements!H2:H=\"OPEN\"',
    ')',
    '};\"\" )'
  ].join('');
}

function returnViewFormula_() {
  return [
    '=IFERROR({',
    '"Instrument"\\\"Persoon\"\\\"Retourlocatie\"\\\"Retour op\"\\\"Status\";',
    'FILTER({',
    'IF(Movements!B2:B<>\"\";VLOOKUP(Movements!B2:B;Instruments!A:B;2;FALSE);\"\")\\',
    'IF(Movements!C2:C<>\"\";VLOOKUP(Movements!C2:C;People!A:B;2;FALSE);\"\")\\',
    'IF(Movements!F2:F<>\"\";VLOOKUP(Movements!F2:F;Locations!A:B;2;FALSE);\"\")\\',
    'Movements!G2:G\\',
    'Movements!H2:H',
    '};',
    'Movements!H2:H=\"CLOSED\"',
    ')',
    '};\"\" )'
  ].join('');
}

function maintenanceViewFormula_() {
  return [
    '=IFERROR({',
    '"Instrument"\\\"Categorie\"\\\"Kosten\"\\\"Groot\"\\\"Datum\";',
    'FILTER({',
    'IF(Maintenance!B2:B<>\"\";VLOOKUP(Maintenance!B2:B;Instruments!A:B;2;FALSE);\"\")\\',
    'Maintenance!C2:C\\',
    'Maintenance!D2:D\\',
    'Maintenance!E2:E\\',
    'Maintenance!F2:F',
    '};',
    'Maintenance!B2:B<>\"\"',
    ')',
    '};\"\" )'
  ].join('');
}

function usageViewFormula_() {
  return [
    '=IFERROR({',
    '"Instrument"\\\"Units\"\\\"Type\"\\\"Datum\";',
    'FILTER({',
    'IF(Usage_Events!B2:B<>\"\";VLOOKUP(Usage_Events!B2:B;Instruments!A:B;2;FALSE);\"\")\\',
    'Usage_Events!C2:C\\',
    'Usage_Events!D2:D\\',
    'Usage_Events!E2:E',
    '};',
    'Usage_Events!B2:B<>\"\"',
    ')',
    '};\"\" )'
  ].join('');
}

function protectViewSheets_(names) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  names.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;
    var protection = sheet.protect();
    protection.setDescription('Instrument Tracker read-only view: ' + name);
    protection.setWarningOnly(false);
    var me = Session.getEffectiveUser();
    protection.addEditor(me);
    var editors = protection.getEditors();
    editors.forEach(function(editor) {
      if (editor.getEmail() !== me.getEmail()) {
        protection.removeEditor(editor);
      }
    });
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
  });
}
