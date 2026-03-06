function seedDemoData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = { seeded: [], skipped: [] };

  seedIfEmpty_(ss, 'People', seedPeople_, result);
  seedIfEmpty_(ss, 'Locations', seedLocations_, result);
  seedIfEmpty_(ss, 'Instruments', seedInstruments_, result);
  seedIfEmpty_(ss, 'Movements', seedMovements_, result);
  seedIfEmpty_(ss, 'Maintenance', seedMaintenance_, result);
  seedIfEmpty_(ss, 'Usage_Events', seedUsage_, result);

  auditLog_('SEED_DEMO', 'DEMO', '', JSON.stringify(result));
  return result;
}

function clearAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = [
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
  sheetNames.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  });
  auditLog_('CLEAR_ALL_DATA', 'ADMIN', '', 'Alle data tabbladen leeggemaakt');
  return { ok: true };
}

function seedIfEmpty_(ss, sheetName, seeder, result) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  if (sheet.getLastRow() > 1) {
    result.skipped.push(sheetName);
    return;
  }
  seeder(sheet);
  result.seeded.push(sheetName);
}

function seedPeople_(sheet) {
  var now = nowIso_();
  var rows = [
    ['PER-0001','Sanne de Vries','Docent klarinet',now,now],
    ['PER-0002','Joris van Dijk','Leerling houtblazers',now,now],
    ['PER-0003','Noura Bakker','Docent saxofoon',now,now],
    ['PER-0004','Mila Jansen','Orkestlid',now,now],
    ['PER-0005','Ruben Smit','Technisch beheer',now,now]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedLocations_(sheet) {
  var now = nowIso_();
  var rows = [
    ['LOC-0001','Hoofdmagazijn','Schoollaan 12, Utrecht','Stelling A',now,now],
    ['LOC-0002','Leslokaal 1','Muziekweg 3, Utrecht','Kast 2',now,now],
    ['LOC-0003','Repetitieruimte','Muziekweg 3, Utrecht','Hoekkast',now,now],
    ['LOC-0004','Werkplaats','Industrieweg 8, Utrecht','Bank 1',now,now]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedInstruments_(sheet) {
  var now = nowIso_();
  var rows = [
    ['INS-0001','Yamaha Klarinet','Klarinet','Yamaha','CL-1001','2022-03-10',1200,8,150,'IN_STORAGE','LOC-0001','', 'Lesinstrument',now,now],
    ['INS-0002','Selmer Saxofoon','Saxofoon','Selmer','SX-204','2021-09-15',2800,10,300,'IN_STORAGE','LOC-0002','', 'Alt saxofoon',now,now],
    ['INS-0003','Jupiter Dwarsfluit','Dwarsfluit','Jupiter','FL-330','2020-01-05',900,7,120,'IN_STORAGE','LOC-0001','', 'Reserve',now,now],
    ['INS-0004','Pearl Dwarsfluit','Dwarsfluit','Pearl','FL-900','2019-11-20',1500,8,200,'IN_STORAGE','LOC-0003','', 'Hoofdset',now,now],
    ['INS-0005','Yamaha Trompet','Trompet','Yamaha','TR-778','2023-05-01',1100,9,140,'IN_STORAGE','LOC-0002','', 'Nieuw',now,now],
    ['INS-0006','Buffet Klarinet','Klarinet','Buffet','CL-777','2018-02-12',1700,9,220,'IN_STORAGE','LOC-0001','', 'Lesinstrument',now,now]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedMovements_(sheet) {
  var now = nowIso_();
  var rows = [
    ['MOV-0001','INS-0001','PER-0002','LOC-0001','2024-09-01','LOC-0001','2024-09-20','CLOSED','Lesperiode',now,now],
    ['MOV-0002','INS-0002','PER-0003','LOC-0002','2024-10-05','','','OPEN','Repetities',now,now],
    ['MOV-0003','INS-0004','PER-0004','LOC-0003','2024-08-15','LOC-0003','2024-09-01','CLOSED','Concert',now,now]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedMaintenance_(sheet) {
  var now = nowIso_();
  var rows = [
    ['MNT-0001','INS-0001','CLEANING',45,'false','2024-06-12','Schoonmaak',now,now],
    ['MNT-0002','INS-0002','PADS',180,'true','2024-07-05','Pads vervangen',now,now],
    ['MNT-0003','INS-0004','ADJUSTMENT',60,'false','2024-05-22','Afstelling',now,now],
    ['MNT-0004','INS-0006','OVERHAUL',350,'true','2023-12-10','Grote beurt',now,now]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedUsage_(sheet) {
  var now = nowIso_();
  var rows = [
    ['USE-0001','INS-0001',6,'hours','2024-09-03','Les',now,now],
    ['USE-0002','INS-0001',4,'hours','2024-09-10','Oefenen',now,now],
    ['USE-0003','INS-0002',3,'hours','2024-10-07','Repetitie',now,now],
    ['USE-0004','INS-0002',5,'hours','2024-10-12','Repetitie',now,now],
    ['USE-0005','INS-0004',2,'hours','2024-08-20','Concert',now,now]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}
