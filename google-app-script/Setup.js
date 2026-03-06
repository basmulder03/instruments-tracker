function setupTrackerSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfigs = [
    { name: 'Instruments', headers: [
      'InstrumentId','Naam','Type','Merk','Serienummer','PurchaseDate','PurchaseCost',
      'UsefulLifeYears','SalvageValue','CurrentStatus','CurrentLocationId','CurrentPersonId',
      'Notes','CreatedAt','UpdatedAt'
    ]},
    { name: 'People', headers: [
      'PersonId','Naam','Notes','CreatedAt','UpdatedAt'
    ]},
    { name: 'Locations', headers: [
      'LocationId','Naam','Adres','Notes','CreatedAt','UpdatedAt'
    ]},
    { name: 'Movements', headers: [
      'MovementId','InstrumentId','CheckoutPersonId','CheckoutLocationId','CheckoutAt',
      'ReturnLocationId','ReturnAt','Status','Notes','CreatedAt','UpdatedAt'
    ]},
    { name: 'Maintenance', headers: [
      'MaintenanceId','InstrumentId','Category','Cost','IsMajor','PerformedAt',
      'Notes','CreatedAt','UpdatedAt'
    ]},
    { name: 'Usage_Events', headers: [
      'UsageId','InstrumentId','Units','UnitType','SessionAt','Notes','CreatedAt','UpdatedAt'
    ]},
    { name: 'AuditLog', headers: [
      'AuditId','Timestamp','Actor','Action','EntityType','EntityId','Details','PrevHash','RowHash'
    ]},
    { name: 'Usage_Stats', headers: ['InstrumentId','UnitsTotal','UnitsPerDay','UnitsPerWeek','UpdatedAt'] },
    { name: 'Maintenance_Predictions', headers: [
      'InstrumentId','Category','PredictedNextRevision','PredictedCost','Basis','UpdatedAt'
    ]},
    { name: 'Depreciation', headers: [
      'InstrumentId','Year','StartValue','Depreciation','EndValue','UpdatedAt'
    ]},
    { name: 'Dashboard Financieel', headers: ['Placeholder'] }
  ];

  sheetConfigs.forEach(function(cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.name);
    }
    ensureHeaders_(sheet, cfg.headers);
    sheet.setFrozenRows(1);
  });

  applyValidations_();
  applyProtections();
  applyViewsAndHiding();
}

function applyValidations_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var instruments = ss.getSheetByName('Instruments');
  if (instruments) {
    var statusCol = getHeaderMap_(instruments)['CurrentStatus'];
    if (statusCol) {
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['IN_STORAGE','CHECKED_OUT','IN_REPAIR'], true)
        .setAllowInvalid(false)
        .build();
      if (instruments.getMaxRows() > 1) {
        var range = instruments.getRange(2, statusCol, instruments.getMaxRows() - 1);
        range.setDataValidation(rule);
      }
    }
  }

  var maintenance = ss.getSheetByName('Maintenance');
  if (maintenance) {
    var catCol = getHeaderMap_(maintenance)['Category'];
    if (catCol) {
      var rule2 = SpreadsheetApp.newDataValidation()
        .requireValueInList(['PADS','OVERHAUL','ADJUSTMENT','CLEANING','REPAIR_OTHER'], true)
        .setAllowInvalid(false)
        .build();
      if (maintenance.getMaxRows() > 1) {
        var range2 = maintenance.getRange(2, catCol, maintenance.getMaxRows() - 1);
        range2.setDataValidation(rule2);
      }
    }
  }
}
