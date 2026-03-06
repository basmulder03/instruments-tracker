function rebuildFinancials() {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    buildDepreciationSchedule_();
    auditLog_('REBUILD_FINANCIALS', 'Depreciation', '', 'Herbouw afschrijving');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function rebuildMaintenanceAnalytics() {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    buildUsageStats_();
    buildMaintenancePredictions_();
    auditLog_('REBUILD_MAINTENANCE_ANALYTICS', 'Maintenance_Predictions', '', 'Herbouw onderhoudsanalyses');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function buildDepreciationSchedule_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var instruments = ss.getSheetByName('Instruments');
  var depSheet = ss.getSheetByName('Depreciation');
  if (!instruments || !depSheet) return;

  var headers = instruments.getRange(1, 1, 1, instruments.getLastColumn()).getValues()[0];
  var rows = instruments.getLastRow() > 1
    ? instruments.getRange(2, 1, instruments.getLastRow() - 1, instruments.getLastColumn()).getValues()
    : [];

  var out = [];
  var now = nowIso_();
  rows.forEach(function(row) {
    var obj = rowToObject_(headers, row);
    var instrumentId = String(obj.InstrumentId || '').trim();
    var purchaseDate = parseDate_(obj.PurchaseDate);
    var purchaseCost = parseNumber_(obj.PurchaseCost);
    var lifeYears = parseInt(obj.UsefulLifeYears, 10);
    var salvage = parseNumber_(obj.SalvageValue);

    if (!instrumentId || !purchaseDate || !purchaseCost || !lifeYears) return;
    if (lifeYears <= 0) return;

    var annualDep = (purchaseCost - salvage) / lifeYears;
    if (annualDep < 0) annualDep = 0;
    var startValue = purchaseCost;
    var year = purchaseDate.getFullYear();

    for (var i = 0; i < lifeYears; i++) {
      var dep = round2_(annualDep);
      var endValue = round2_(Math.max(salvage, startValue - dep));
      out.push([
        instrumentId,
        String(year + i),
        round2_(startValue),
        dep,
        endValue,
        now
      ]);
      startValue = endValue;
    }
  });

  clearDataRows_(depSheet);
  if (out.length) {
    depSheet.getRange(2, 1, out.length, out[0].length).setValues(out);
  }
}

function buildUsageStats_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usage = ss.getSheetByName('Usage_Events');
  var stats = ss.getSheetByName('Usage_Stats');
  if (!usage || !stats) return;

  var headers = usage.getRange(1, 1, 1, usage.getLastColumn()).getValues()[0];
  var rows = usage.getLastRow() > 1
    ? usage.getRange(2, 1, usage.getLastRow() - 1, usage.getLastColumn()).getValues()
    : [];

  var byInstrument = {};
  rows.forEach(function(row) {
    var obj = rowToObject_(headers, row);
    var instrumentId = String(obj.InstrumentId || '').trim();
    var units = parseNumber_(obj.Units);
    var sessionAt = parseDate_(obj.SessionAt);
    if (!instrumentId || !sessionAt) return;

    if (!byInstrument[instrumentId]) {
      byInstrument[instrumentId] = { total: 0, first: sessionAt, last: sessionAt };
    }
    byInstrument[instrumentId].total += units;
    if (sessionAt < byInstrument[instrumentId].first) byInstrument[instrumentId].first = sessionAt;
    if (sessionAt > byInstrument[instrumentId].last) byInstrument[instrumentId].last = sessionAt;
  });

  var out = [];
  var now = nowIso_();
  Object.keys(byInstrument).forEach(function(id) {
    var item = byInstrument[id];
    var days = Math.max(1, Math.floor((item.last - item.first) / 86400000) + 1);
    var perDay = item.total / days;
    var perWeek = perDay * 7;
    out.push([
      id,
      round2_(item.total),
      round2_(perDay),
      round2_(perWeek),
      now
    ]);
  });

  clearDataRows_(stats);
  if (out.length) {
    stats.getRange(2, 1, out.length, out[0].length).setValues(out);
  }
}

function buildMaintenancePredictions_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var maintenance = ss.getSheetByName('Maintenance');
  var predictions = ss.getSheetByName('Maintenance_Predictions');
  var instruments = ss.getSheetByName('Instruments');
  var usageStats = ss.getSheetByName('Usage_Stats');
  if (!maintenance || !predictions || !instruments) return;

  var instrumentMap = buildInstrumentMap_(instruments);
  var usageMap = buildUsageMap_(usageStats);

  var maintHeaders = maintenance.getRange(1, 1, 1, maintenance.getLastColumn()).getValues()[0];
  var maintRows = maintenance.getLastRow() > 1
    ? maintenance.getRange(2, 1, maintenance.getLastRow() - 1, maintenance.getLastColumn()).getValues()
    : [];

  var perKey = {};
  maintRows.forEach(function(row) {
    var obj = rowToObject_(maintHeaders, row);
    var instrumentId = String(obj.InstrumentId || '').trim();
    var category = String(obj.Category || '').trim();
    var performedAt = parseDate_(obj.PerformedAt);
    var cost = parseNumber_(obj.Cost);
    if (!instrumentId || !category || !performedAt) return;

    var key = instrumentId + '||' + category;
    if (!perKey[key]) {
      perKey[key] = { instrumentId: instrumentId, category: category, events: [], costs: [] };
    }
    perKey[key].events.push(performedAt);
    if (cost) perKey[key].costs.push(cost);
  });

  var stats = {};
  Object.keys(perKey).forEach(function(key) {
    var item = perKey[key];
    item.events.sort(function(a, b) { return a - b; });
    var intervals = [];
    for (var i = 1; i < item.events.length; i++) {
      intervals.push((item.events[i] - item.events[i - 1]) / 86400000);
    }
    stats[key] = {
      instrumentId: item.instrumentId,
      category: item.category,
      lastDate: item.events[item.events.length - 1],
      intervalDays: median_(intervals),
      cost: median_(item.costs),
      usageBetween: computeUsageBetween_(item.instrumentId, item.events)
    };
  });

  var typeCategoryStats = aggregateByType_(stats, instrumentMap);
  var categoryStats = aggregateByCategory_(stats);

  var out = [];
  var now = nowIso_();
  Object.keys(stats).forEach(function(key) {
    var item = stats[key];
    var instrumentType = instrumentMap[item.instrumentId] || '';
    var interval = item.intervalDays
      || getFallbackInterval_(typeCategoryStats, categoryStats, instrumentType, item.category)
      || 180;
    var cost = item.cost
      || getFallbackCost_(typeCategoryStats, categoryStats, instrumentType, item.category)
      || 0;

    var predictedTime = new Date(item.lastDate.getTime() + interval * 86400000);
    var predictedUsage = null;
    var basis = 'time';

    if (item.usageBetween && item.usageBetween.length) {
      var unitsBetween = median_(item.usageBetween);
      var usage = usageMap[item.instrumentId];
      if (usage && usage.unitsPerDay > 0) {
        var daysByUsage = unitsBetween / usage.unitsPerDay;
        predictedUsage = new Date(item.lastDate.getTime() + daysByUsage * 86400000);
      }
    }

    var predicted = predictedTime;
    if (predictedUsage && predictedUsage < predictedTime) {
      predicted = predictedUsage;
      basis = 'usage';
    }

    out.push([
      item.instrumentId,
      item.category,
      predicted.toISOString(),
      round2_(cost),
      basis,
      now
    ]);
  });

  clearDataRows_(predictions);
  if (out.length) {
    predictions.getRange(2, 1, out.length, out[0].length).setValues(out);
  }
}

function buildInstrumentMap_(sheet) {
  var map = {};
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
    : [];
  rows.forEach(function(row) {
    var obj = rowToObject_(headers, row);
    var id = String(obj.InstrumentId || '').trim();
    var type = String(obj.Type || '').trim();
    if (id) map[id] = type;
  });
  return map;
}

function buildUsageMap_(sheet) {
  var map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  rows.forEach(function(row) {
    var instrumentId = String(row[0] || '').trim();
    if (!instrumentId) return;
    map[instrumentId] = {
      unitsTotal: parseNumber_(row[1]),
      unitsPerDay: parseNumber_(row[2]),
      unitsPerWeek: parseNumber_(row[3])
    };
  });
  return map;
}

function computeUsageBetween_(instrumentId, events) {
  var usage = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usage_Events');
  if (!usage || events.length < 2) return [];
  var headers = usage.getRange(1, 1, 1, usage.getLastColumn()).getValues()[0];
  var rows = usage.getLastRow() > 1
    ? usage.getRange(2, 1, usage.getLastRow() - 1, usage.getLastColumn()).getValues()
    : [];

  var usageEvents = [];
  rows.forEach(function(row) {
    var obj = rowToObject_(headers, row);
    if (String(obj.InstrumentId || '').trim() !== instrumentId) return;
    var date = parseDate_(obj.SessionAt);
    var units = parseNumber_(obj.Units);
    if (!date) return;
    usageEvents.push({ date: date, units: units });
  });

  var result = [];
  for (var i = 1; i < events.length; i++) {
    var start = events[i - 1];
    var end = events[i];
    var total = 0;
    usageEvents.forEach(function(evt) {
      if (evt.date > start && evt.date <= end) {
        total += evt.units;
      }
    });
    if (total > 0) result.push(total);
  }
  return result;
}

function aggregateByType_(stats, instrumentMap) {
  var out = {};
  Object.keys(stats).forEach(function(key) {
    var item = stats[key];
    var type = instrumentMap[item.instrumentId] || '';
    if (!type) return;
    var tkey = type + '||' + item.category;
    if (!out[tkey]) out[tkey] = { intervals: [], costs: [] };
    if (item.intervalDays) out[tkey].intervals.push(item.intervalDays);
    if (item.cost) out[tkey].costs.push(item.cost);
  });
  Object.keys(out).forEach(function(k) {
    out[k].interval = median_(out[k].intervals);
    out[k].cost = median_(out[k].costs);
  });
  return out;
}

function aggregateByCategory_(stats) {
  var out = {};
  Object.keys(stats).forEach(function(key) {
    var item = stats[key];
    var cat = item.category;
    if (!out[cat]) out[cat] = { intervals: [], costs: [] };
    if (item.intervalDays) out[cat].intervals.push(item.intervalDays);
    if (item.cost) out[cat].costs.push(item.cost);
  });
  Object.keys(out).forEach(function(k) {
    out[k].interval = median_(out[k].intervals);
    out[k].cost = median_(out[k].costs);
  });
  return out;
}

function getFallbackInterval_(typeCategoryStats, categoryStats, type, category) {
  if (type && typeCategoryStats[type + '||' + category]) {
    return typeCategoryStats[type + '||' + category].interval;
  }
  if (categoryStats[category]) return categoryStats[category].interval;
  return null;
}

function getFallbackCost_(typeCategoryStats, categoryStats, type, category) {
  if (type && typeCategoryStats[type + '||' + category]) {
    return typeCategoryStats[type + '||' + category].cost;
  }
  if (categoryStats[category]) return categoryStats[category].cost;
  return null;
}

function parseDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  var d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

function parseNumber_(value) {
  if (value === null || value === undefined || value === '') return 0;
  var num = parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

function median_(arr) {
  if (!arr || !arr.length) return null;
  var sorted = arr.slice().sort(function(a, b) { return a - b; });
  var mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function round2_(num) {
  return Math.round((num || 0) * 100) / 100;
}

function clearDataRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}
