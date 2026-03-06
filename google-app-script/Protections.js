function applyProtections() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  protectSheetStrict_(ss, 'AuditLog');
  protectSheetWarning_(ss, 'Movements');
  protectSheetWarning_(ss, 'Maintenance');
  protectSheetWarning_(ss, 'Usage_Events');
  protectSheetWarning_(ss, 'Instruments');
}

function protectSheetStrict_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return;
  var protection = sheet.protect();
  protection.setDescription('Instrument Tracker bescherming: ' + name);
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
}

function protectSheetWarning_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return;
  var protection = sheet.protect();
  protection.setDescription('Instrument Tracker waarschuwing: ' + name);
  protection.setWarningOnly(true);
}
