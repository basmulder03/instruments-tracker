function checkoutInstrument(payload) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var instrumentId = (payload && payload.InstrumentId) ? String(payload.InstrumentId).trim() : '';
    var personId = (payload && payload.PersonId) ? String(payload.PersonId).trim() : '';
    var locationId = (payload && payload.LocationId) ? String(payload.LocationId).trim() : '';
    var notes = (payload && payload.Notes) ? String(payload.Notes) : '';

    if (!instrumentId || !personId) {
      throw new Error('InstrumentId en PersonId zijn verplicht');
    }

    var instrument = getInstrumentRecord_(instrumentId);
    if (!instrument) {
      throw new Error('Instrument niet gevonden: ' + instrumentId);
    }

    var status = instrument.rowObj.CurrentStatus || '';
    if (status === 'CHECKED_OUT') {
      throw new Error('Instrument is al uitgegeven');
    }
    if (status === 'IN_REPAIR') {
      throw new Error('Instrument is in reparatie');
    }

    var now = nowIso_();
    var movementId = generateNextIdInternal_('MOVEMENT', null).id;
    var movementSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Movements');
    if (!movementSheet) {
      throw new Error('Sheet ontbreekt: Movements');
    }

    var movementHeaders = getHeaderMap_(movementSheet);
    var movementRow = new Array(movementSheet.getLastColumn());
    var movementObj = {
      MovementId: movementId,
      InstrumentId: instrumentId,
      CheckoutPersonId: personId,
      CheckoutLocationId: locationId || (instrument.rowObj.CurrentLocationId || ''),
      CheckoutAt: now,
      ReturnLocationId: '',
      ReturnAt: '',
      Status: 'OPEN',
      Notes: notes,
      CreatedAt: now,
      UpdatedAt: now
    };
    Object.keys(movementHeaders).forEach(function(key) {
      var idx = movementHeaders[key] - 1;
      movementRow[idx] = movementObj[key] || '';
    });
    movementSheet.appendRow(movementRow);

    var before = JSON.parse(JSON.stringify(instrument.rowObj));
    updateRow_(instrument.sheet, instrument.headers, instrument.rowIndex, {
      CurrentStatus: 'CHECKED_OUT',
      CurrentPersonId: personId,
      CurrentLocationId: locationId || '',
      UpdatedAt: now
    });
    var after = getRowObject_(instrument.sheet, instrument.headers, instrument.rowIndex);

    auditLog_('CHECKOUT', 'Instrument', instrumentId, JSON.stringify({
      movementId: movementId,
      before: before,
      after: after
    }));

    return { ok: true, movementId: movementId };
  } finally {
    lock.releaseLock();
  }
}

function returnInstrument(payload) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var instrumentId = (payload && payload.InstrumentId) ? String(payload.InstrumentId).trim() : '';
    var returnLocationId = (payload && payload.ReturnLocationId) ? String(payload.ReturnLocationId).trim() : '';
    var notes = (payload && payload.Notes) ? String(payload.Notes) : '';

    if (!instrumentId || !returnLocationId) {
      throw new Error('InstrumentId en ReturnLocationId zijn verplicht');
    }

    var instrument = getInstrumentRecord_(instrumentId);
    if (!instrument) {
      throw new Error('Instrument niet gevonden: ' + instrumentId);
    }

    var openMovement = findOpenMovement_(instrumentId);
    if (!openMovement) {
      throw new Error('Geen open movement gevonden voor ' + instrumentId);
    }

    var now = nowIso_();
    updateRow_(openMovement.sheet, openMovement.headers, openMovement.rowIndex, {
      ReturnLocationId: returnLocationId,
      ReturnAt: now,
      Status: 'CLOSED',
      UpdatedAt: now,
      Notes: notes || (openMovement.rowObj.Notes || '')
    });

    var before = JSON.parse(JSON.stringify(instrument.rowObj));
    updateRow_(instrument.sheet, instrument.headers, instrument.rowIndex, {
      CurrentStatus: 'IN_STORAGE',
      CurrentLocationId: returnLocationId,
      CurrentPersonId: '',
      UpdatedAt: now
    });
    var after = getRowObject_(instrument.sheet, instrument.headers, instrument.rowIndex);

    auditLog_('RETURN', 'Instrument', instrumentId, JSON.stringify({
      movementId: openMovement.rowObj.MovementId || '',
      before: before,
      after: after
    }));

    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function addMaintenance(payload) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var instrumentId = (payload && payload.InstrumentId) ? String(payload.InstrumentId).trim() : '';
    var category = (payload && payload.Category) ? String(payload.Category).trim() : '';
    var cost = (payload && payload.Cost !== undefined) ? String(payload.Cost) : '';
    var isMajor = (payload && payload.IsMajor) ? String(payload.IsMajor) : '';
    var performedAt = (payload && payload.PerformedAt) ? String(payload.PerformedAt).trim() : nowIso_();
    var notes = (payload && payload.Notes) ? String(payload.Notes) : '';

    if (!instrumentId || !category) {
      throw new Error('InstrumentId en Category zijn verplicht');
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Maintenance');
    if (!sheet) {
      throw new Error('Sheet ontbreekt: Maintenance');
    }

    var headers = getHeaderMap_(sheet);
    var row = new Array(sheet.getLastColumn());
    var now = nowIso_();
    var maintenanceId = generateNextIdInternal_('MAINTENANCE', null).id;
    var rowObj = {
      MaintenanceId: maintenanceId,
      InstrumentId: instrumentId,
      Category: category,
      Cost: cost,
      IsMajor: isMajor,
      PerformedAt: performedAt,
      Notes: notes,
      CreatedAt: now,
      UpdatedAt: now
    };
    Object.keys(headers).forEach(function(key) {
      var idx = headers[key] - 1;
      row[idx] = rowObj[key] || '';
    });
    sheet.appendRow(row);

    auditLog_('MAINTENANCE_ADD', 'Maintenance', maintenanceId, JSON.stringify(rowObj));

    return { ok: true, maintenanceId: maintenanceId };
  } finally {
    lock.releaseLock();
  }
}

function logUsage(payload) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var instrumentId = (payload && payload.InstrumentId) ? String(payload.InstrumentId).trim() : '';
    var units = (payload && payload.Units !== undefined) ? String(payload.Units) : '';
    var unitType = (payload && payload.UnitType) ? String(payload.UnitType).trim() : '';
    var sessionAt = (payload && payload.SessionAt) ? String(payload.SessionAt).trim() : nowIso_();
    var notes = (payload && payload.Notes) ? String(payload.Notes) : '';

    if (!instrumentId || !units) {
      throw new Error('InstrumentId en Units zijn verplicht');
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usage_Events');
    if (!sheet) {
      throw new Error('Sheet ontbreekt: Usage_Events');
    }

    var headers = getHeaderMap_(sheet);
    var row = new Array(sheet.getLastColumn());
    var now = nowIso_();
    var usageId = generateNextIdInternal_('USAGE', null).id;
    var rowObj = {
      UsageId: usageId,
      InstrumentId: instrumentId,
      Units: units,
      UnitType: unitType,
      SessionAt: sessionAt,
      Notes: notes,
      CreatedAt: now,
      UpdatedAt: now
    };
    Object.keys(headers).forEach(function(key) {
      var idx = headers[key] - 1;
      row[idx] = rowObj[key] || '';
    });
    sheet.appendRow(row);

    auditLog_('USAGE_ADD', 'Usage', usageId, JSON.stringify(rowObj));

    return { ok: true, usageId: usageId };
  } finally {
    lock.releaseLock();
  }
}

function getInstrumentHistory(instrumentId) {
  var id = instrumentId ? String(instrumentId).trim() : '';
  if (!id) return { ok: false, error: 'InstrumentId ontbreekt' };

  var history = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var movements = ss.getSheetByName('Movements');
  if (movements) {
    var rows = getRowsForInstrument_(movements, id, 'InstrumentId');
    rows.forEach(function(r) {
      history.push({
        type: 'Movement',
        date: r.CheckoutAt || r.ReturnAt || '',
        data: r
      });
    });
  }

  var maintenance = ss.getSheetByName('Maintenance');
  if (maintenance) {
    var rows2 = getRowsForInstrument_(maintenance, id, 'InstrumentId');
    rows2.forEach(function(r) {
      history.push({
        type: 'Maintenance',
        date: r.PerformedAt || '',
        data: r
      });
    });
  }

  var usage = ss.getSheetByName('Usage_Events');
  if (usage) {
    var rows3 = getRowsForInstrument_(usage, id, 'InstrumentId');
    rows3.forEach(function(r) {
      history.push({
        type: 'Usage',
        date: r.SessionAt || '',
        data: r
      });
    });
  }

  history.sort(function(a, b) {
    return String(b.date).localeCompare(String(a.date));
  });

  return { ok: true, items: history.slice(0, 50) };
}

function getInstrumentRecord_(instrumentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Instruments');
  if (!sheet) return null;
  var headers = getHeaderMap_(sheet);
  var idCol = headers['InstrumentId'];
  if (!idCol) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === instrumentId) {
      var rowIndex = i + 2;
      var row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      return {
        sheet: sheet,
        headers: headers,
        rowIndex: rowIndex,
        rowObj: getRowObject_(sheet, headers, rowIndex)
      };
    }
  }
  return null;
}

function findOpenMovement_(instrumentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Movements');
  if (!sheet) return null;
  var headers = getHeaderMap_(sheet);
  var idCol = headers['InstrumentId'];
  if (!idCol) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = rows.length - 1; i >= 0; i--) {
    var row = rows[i];
    var obj = rowToObject_(headerRow, row);
    if (String(obj.InstrumentId) === instrumentId && (!obj.ReturnAt || obj.Status === 'OPEN')) {
      return {
        sheet: sheet,
        headers: headers,
        rowIndex: i + 2,
        rowObj: obj
      };
    }
  }
  return null;
}

function getRowsForInstrument_(sheet, instrumentId, idHeader) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idIndex = headers.indexOf(idHeader);
  if (idIndex === -1) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var result = [];
  rows.forEach(function(row) {
    if (String(row[idIndex]) === instrumentId) {
      result.push(rowToObject_(headers, row));
    }
  });
  return result;
}
