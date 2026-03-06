function verifyAuditChain() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  if (!sheet) {
    return { ok: false, error: 'AuditLog ontbreekt' };
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { ok: true };
  }

  var headers = data[0];
  var prevHash = '';
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowObj = rowToObject_(headers, row);
    if (rowObj.PrevHash !== prevHash) {
      return { ok: false, row: i + 1, error: 'PrevHash mismatch' };
    }
    var expected = computeRowHash_(rowObj);
    if (rowObj.RowHash !== expected) {
      return { ok: false, row: i + 1, error: 'RowHash mismatch' };
    }
    prevHash = rowObj.RowHash;
  }
  return { ok: true };
}

function auditLog_(action, entityType, entityId, details) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLog');
  if (!sheet) {
    throw new Error('AuditLog ontbreekt');
  }
  var headers = getHeaderMap_(sheet);
  var row = new Array(sheet.getLastColumn());
  var now = nowIso_();
  var actor = Session.getActiveUser().getEmail() || 'onbekend';
  var prevHash = getLastAuditHash_(sheet, headers);

  var rowObj = {
    AuditId: generateNextIdInternal_('AUDIT', null).id,
    Timestamp: now,
    Actor: actor,
    Action: action,
    EntityType: entityType,
    EntityId: entityId,
    Details: details || '',
    PrevHash: prevHash,
    RowHash: ''
  };
  rowObj.RowHash = computeRowHash_(rowObj);

  Object.keys(headers).forEach(function(key) {
    var idx = headers[key] - 1;
    row[idx] = rowObj[key] || '';
  });
  sheet.appendRow(row);
}

function computeRowHash_(rowObj) {
  var parts = [
    rowObj.AuditId || '',
    rowObj.Timestamp || '',
    rowObj.Actor || '',
    rowObj.Action || '',
    rowObj.EntityType || '',
    rowObj.EntityId || '',
    rowObj.Details || '',
    rowObj.PrevHash || ''
  ];
  var canonical = parts.join('|');
  return sha256Base64_(canonical);
}

function sha256Base64_(text) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(raw);
}

function getLastAuditHash_(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return '';
  var row = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowHashCol = headers['RowHash'];
  return rowHashCol ? (row[rowHashCol - 1] || '') : '';
}
