"use strict";
/**
 * Cloud Functions for Instruments Tracker
 *
 * Scheduled functions (firebase-functions v2):
 *   1. rebuildDepreciationStats  — daily, recomputes depreciation docs
 *   2. rebuildUsageStats         — daily, recomputes usage_stats docs
 *   3. expireInvitations         — daily, marks expired invitations
 *   4. pruneAuditLog             — weekly, deletes audit entries older than retention window
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pruneAuditLog = exports.expireInvitations = exports.rebuildUsageStats = exports.rebuildDepreciationStats = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
admin.initializeApp();
const db = admin.firestore();
// ---------------------------------------------------------------------------
// 1. Rebuild depreciation stats
// ---------------------------------------------------------------------------
exports.rebuildDepreciationStats = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours', timeZone: 'Europe/Amsterdam' }, async () => {
    var _a, _b, _c, _d;
    v2_1.logger.info('rebuildDepreciationStats: starting');
    const instrumentsSnap = await db.collection('instruments').get();
    const now = new Date();
    const currentYear = now.getFullYear();
    const batch = db.batch();
    for (const instrDoc of instrumentsSnap.docs) {
        const instr = instrDoc.data();
        const purchaseCost = (_a = instr.purchaseCost) !== null && _a !== void 0 ? _a : 0;
        const usefulLifeYears = (_b = instr.usefulLifeYears) !== null && _b !== void 0 ? _b : 5;
        const salvageValue = (_c = instr.salvageValue) !== null && _c !== void 0 ? _c : 0;
        const purchaseDate = (_d = instr.purchaseDate) !== null && _d !== void 0 ? _d : '';
        if (!purchaseDate || usefulLifeYears <= 0)
            continue;
        const purchaseYear = parseInt(purchaseDate.substring(0, 4), 10);
        if (isNaN(purchaseYear))
            continue;
        const annualDep = (purchaseCost - salvageValue) / usefulLifeYears;
        // Write or overwrite depreciation docs for every year from purchase year to current year
        for (let year = purchaseYear; year <= currentYear; year++) {
            const yearsElapsed = year - purchaseYear;
            const startValue = Math.max(salvageValue, purchaseCost - annualDep * yearsElapsed);
            const depreciation = yearsElapsed < usefulLifeYears ? annualDep : 0;
            const endValue = Math.max(salvageValue, startValue - depreciation);
            const docRef = db
                .collection('depreciation')
                .doc(`${instrDoc.id}_${year}`);
            batch.set(docRef, {
                instrumentId: instrDoc.id,
                year,
                startValue: Math.round(startValue * 100) / 100,
                depreciation: Math.round(depreciation * 100) / 100,
                endValue: Math.round(endValue * 100) / 100,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
    await batch.commit();
    v2_1.logger.info('rebuildDepreciationStats: done');
});
// ---------------------------------------------------------------------------
// 2. Rebuild usage stats
// ---------------------------------------------------------------------------
exports.rebuildUsageStats = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours', timeZone: 'Europe/Amsterdam' }, async () => {
    var _a, _b, _c;
    v2_1.logger.info('rebuildUsageStats: starting');
    const usageSnap = await db.collection('usage_events').get();
    // Accumulate totals per instrument
    const totals = {};
    const firstDate = {};
    const lastDate = {};
    for (const doc of usageSnap.docs) {
        const data = doc.data();
        const id = data.instrumentId;
        const units = (_a = data.units) !== null && _a !== void 0 ? _a : 0;
        const dateStr = (_b = data.date) !== null && _b !== void 0 ? _b : '';
        const date = new Date(dateStr);
        totals[id] = ((_c = totals[id]) !== null && _c !== void 0 ? _c : 0) + units;
        if (!firstDate[id] || date < firstDate[id])
            firstDate[id] = date;
        if (!lastDate[id] || date > lastDate[id])
            lastDate[id] = date;
    }
    const batch = db.batch();
    for (const [instrumentId, unitsTotal] of Object.entries(totals)) {
        const first = firstDate[instrumentId];
        const last = lastDate[instrumentId];
        const daySpan = first && last
            ? Math.max(1, Math.round((last.getTime() - first.getTime()) / 86400000) + 1)
            : 1;
        const unitsPerDay = unitsTotal / daySpan;
        const unitsPerWeek = unitsPerDay * 7;
        const docRef = db.collection('usage_stats').doc(instrumentId);
        batch.set(docRef, {
            instrumentId,
            unitsTotal: Math.round(unitsTotal * 100) / 100,
            unitsPerDay: Math.round(unitsPerDay * 100) / 100,
            unitsPerWeek: Math.round(unitsPerWeek * 100) / 100,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();
    v2_1.logger.info('rebuildUsageStats: done');
});
// ---------------------------------------------------------------------------
// 3. Expire invitations
// ---------------------------------------------------------------------------
exports.expireInvitations = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours', timeZone: 'Europe/Amsterdam' }, async () => {
    v2_1.logger.info('expireInvitations: starting');
    const now = admin.firestore.Timestamp.now();
    const snap = await db
        .collection('invitations')
        .where('status', '==', 'pending')
        .where('expiresAt', '<=', now)
        .get();
    if (snap.empty) {
        v2_1.logger.info('expireInvitations: no expired invitations found');
        return;
    }
    const batch = db.batch();
    for (const doc of snap.docs) {
        batch.update(doc.ref, {
            status: 'expired',
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();
    v2_1.logger.info(`expireInvitations: expired ${snap.size} invitations`);
});
// ---------------------------------------------------------------------------
// 4. Prune audit log
// ---------------------------------------------------------------------------
/**
 * Default retention: 365 days.
 * Override by setting a Firestore document at /config/auditRetention
 * with field `retentionDays: number`.
 */
const DEFAULT_RETENTION_DAYS = 365;
exports.pruneAuditLog = (0, scheduler_1.onSchedule)({ schedule: 'every monday 02:00', timeZone: 'Europe/Amsterdam' }, async () => {
    var _a;
    v2_1.logger.info('pruneAuditLog: starting');
    // Read optional retention config
    let retentionDays = DEFAULT_RETENTION_DAYS;
    try {
        const configDoc = await db.collection('config').doc('auditRetention').get();
        if (configDoc.exists) {
            const val = (_a = configDoc.data()) === null || _a === void 0 ? void 0 : _a.retentionDays;
            if (typeof val === 'number' && val > 0)
                retentionDays = val;
        }
    }
    catch (e) {
        v2_1.logger.warn('pruneAuditLog: could not read config/auditRetention, using default', e);
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffTs = admin.firestore.Timestamp.fromDate(cutoff);
    v2_1.logger.info(`pruneAuditLog: deleting entries older than ${cutoff.toISOString()} (retention: ${retentionDays} days)`);
    // Firestore delete in batches of 500
    let totalDeleted = 0;
    let hasMore = true;
    while (hasMore) {
        const snap = await db
            .collection('audit_log')
            .where('timestamp', '<', cutoffTs)
            .limit(500)
            .get();
        if (snap.empty) {
            hasMore = false;
            break;
        }
        const batch = db.batch();
        for (const doc of snap.docs) {
            batch.delete(doc.ref);
        }
        await batch.commit();
        totalDeleted += snap.size;
        if (snap.size < 500)
            hasMore = false;
    }
    v2_1.logger.info(`pruneAuditLog: deleted ${totalDeleted} entries`);
});
//# sourceMappingURL=index.js.map