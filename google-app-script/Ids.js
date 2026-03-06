function generateNextId(entityType, prefixOverride) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var result = generateNextIdInternal_(entityType, prefixOverride);
    auditLog_('GENERATE_ID', 'ID', result.id, 'Aanvraag ID voor ' + entityType);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function generateNextIdInternal_(entityType, prefixOverride) {
  var prefix = prefixOverride || getPrefixFor_(entityType);
  var sheetName = getSheetForEntity_(entityType);
  var idHeader = getIdHeaderFor_(entityType);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet ontbreekt: ' + sheetName);
  }
  var headers = getHeaderMap_(sheet);
  var idCol = headers[idHeader];
  if (!idCol) {
    throw new Error('ID kolom ontbreekt: ' + idHeader);
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { id: prefix + '-0001' };
  }
  var values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var max = 0;
  var re = new RegExp('^' + prefix + '-(\\d+)$');
  for (var i = 0; i < values.length; i++) {
    var v = values[i][0];
    if (!v) continue;
    var m = String(v).match(re);
    if (m) {
      var num = parseInt(m[1], 10);
      if (num > max) max = num;
    }
  }
  var next = max + 1;
  return { id: prefix + '-' + padNumber_(next, 4) };
}

function getPrefixFor_(entityType) {
  var map = {
    PERSON: 'PER',
    LOCATION: 'LOC',
    INSTRUMENT: 'INS',
    MOVEMENT: 'MOV',
    MAINTENANCE: 'MNT',
    USAGE: 'USE',
    AUDIT: 'AUD',
    People: 'PER',
    Locations: 'LOC',
    Instruments: 'INS',
    AuditLog: 'AUD'
  };
  return map[entityType] || String(entityType).substring(0, 3).toUpperCase();
}

function getSheetForEntity_(entityType) {
  var map = {
    PERSON: 'People',
    LOCATION: 'Locations',
    INSTRUMENT: 'Instruments',
    AUDIT: 'AuditLog',
    MOVEMENT: 'Movements',
    MAINTENANCE: 'Maintenance',
    USAGE: 'Usage_Events'
  };
  return map[entityType] || String(entityType);
}

function getIdHeaderFor_(entityType) {
  var map = {
    PERSON: 'PersonId',
    LOCATION: 'LocationId',
    INSTRUMENT: 'InstrumentId',
    AUDIT: 'AuditId',
    MOVEMENT: 'MovementId',
    MAINTENANCE: 'MaintenanceId',
    USAGE: 'UsageId',
    People: 'PersonId',
    Locations: 'LocationId',
    Instruments: 'InstrumentId',
    AuditLog: 'AuditId'
  };
  return map[entityType] || (String(entityType) + 'Id');
}
