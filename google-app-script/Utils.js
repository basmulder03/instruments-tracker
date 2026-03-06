function addEntity_(sheetName, idHeader, payload, options) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet ontbreekt: ' + sheetName);
    }
    var headers = getHeaderMap_(sheet);
    var id = (payload && payload[idHeader]) ? String(payload[idHeader]).trim() : '';
    var generated = false;

    if (!id) {
      var gen = generateNextIdInternal_(options.entityType || sheetName, options.idPrefix || null);
      id = gen.id;
      generated = true;
    }

    if (idExists_(sheet, headers[idHeader], id)) {
      throw new Error('ID bestaat al: ' + id);
    }

    var now = nowIso_();
    var row = buildRow_(sheet, headers, idHeader, id, payload, options, now);
    sheet.appendRow(row);

    if (generated) {
      auditLog_('GENERATE_ID', idHeader, id, 'Auto ID generatie in ' + sheetName);
    }
    auditLog_('CREATE', sheetName, id, JSON.stringify(payload || {}));

    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

function buildRow_(sheet, headers, idHeader, id, payload, options, now) {
  var row = new Array(sheet.getLastColumn());
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var idx = headers[key] - 1;
    if (key === idHeader) {
      row[idx] = id;
      continue;
    }
    if (key === 'CreatedAt' || key === 'UpdatedAt') {
      row[idx] = now;
      continue;
    }
    var value = '';
    if (options && options.defaults && options.defaults[key] !== undefined) {
      value = options.defaults[key];
    }
    if (payload && payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      value = payload[key];
    }
    row[idx] = value;
  }
  return row;
}

function ensureHeaders_(sheet, headers) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var existingSet = {};
  existing.forEach(function(h) { if (h) existingSet[h] = true; });
  var toAdd = [];
  headers.forEach(function(h) {
    if (!existingSet[h]) toAdd.push(h);
  });
  if (toAdd.length) {
    sheet.getRange(1, lastCol + 1, 1, toAdd.length).setValues([toAdd]);
  }
}

function getHeaderMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  headers.forEach(function(h, i) {
    if (h) map[h] = i + 1;
  });
  return map;
}

function rowToObject_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = row[i];
  }
  return obj;
}

function getRowObject_(sheet, headers, rowIndex) {
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  return rowToObject_(headerRow, row);
}

function updateRow_(sheet, headers, rowIndex, updates) {
  Object.keys(updates).forEach(function(key) {
    var col = headers[key];
    if (!col) return;
    sheet.getRange(rowIndex, col).setValue(updates[key]);
  });
}

function getSimpleList_(sheetName, idHeader, nameHeader) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var headers = getHeaderMap_(sheet);
  var idCol = headers[idHeader];
  var nameCol = headers[nameHeader];
  if (!idCol || !nameCol) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var names = sheet.getRange(2, nameCol, lastRow - 1, 1).getValues();
  var list = [];
  for (var i = 0; i < ids.length; i++) {
    if (!ids[i][0]) continue;
    list.push({ id: String(ids[i][0]), name: String(names[i][0] || '') });
  }
  return list;
}

function idExists_(sheet, idCol, id) {
  if (!idCol) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === id) return true;
  }
  return false;
}

function nowIso_() {
  return new Date().toISOString();
}

function padNumber_(num, size) {
  var s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}
