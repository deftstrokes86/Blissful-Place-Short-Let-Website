"use strict";
// LEGACY FILE-DB BOUNDARY:
// This JSON database under .data/booking-mvp-db.json is retained only for legacy reservation,
// inventory, and tour modules that have not been migrated yet.
// Active runtime flows must use Prisma + Supabase Postgres via DATABASE_URL instead.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseId = void 0;
exports.readBookingDatabase = readBookingDatabase;
exports.withBookingDatabase = withBookingDatabase;
exports.getDatabaseFilePath = getDatabaseFilePath;
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const db_utils_1 = require("./db-utils");
var database_identifiers_1 = require("./database-identifiers");
Object.defineProperty(exports, "createDatabaseId", { enumerable: true, get: function () { return database_identifiers_1.createDatabaseId; } });
const DATA_FILE_PATH = (0, node_path_1.join)(process.cwd(), ".data", "booking-mvp-db.json");
const MIN_DRAFT_STEP = 0;
const MAX_DRAFT_STEP = 5;
function isPaymentMethod(value) {
    return value === "website" || value === "transfer" || value === "pos";
}
function isNotificationAudience(value) {
    return value === "guest" || value === "staff";
}
function isNotificationChannel(value) {
    return value === "email" || value === "internal";
}
function isNotificationStatus(value) {
    return value === "pending" || value === "sent" || value === "failed";
}
function isNotificationEventType(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function isDraftProgressStep(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= MIN_DRAFT_STEP && value <= MAX_DRAFT_STEP;
}
function normalizeProgressContext(value, paymentMethod) {
    const fallback = {
        currentStep: MIN_DRAFT_STEP,
        activeBranch: paymentMethod,
    };
    if (!value || typeof value !== "object") {
        return fallback;
    }
    return {
        currentStep: isDraftProgressStep(value.currentStep) ? value.currentStep : fallback.currentStep,
        activeBranch: isPaymentMethod(value.activeBranch) ? value.activeBranch : fallback.activeBranch,
    };
}
function normalizeReservationRecord(value) {
    var _a, _b, _c;
    const paymentMethod = isPaymentMethod(value.paymentMethod) ? value.paymentMethod : null;
    const updatedAt = (_b = (_a = value.updatedAt) !== null && _a !== void 0 ? _a : value.createdAt) !== null && _b !== void 0 ? _b : (0, db_utils_1.nowIso)();
    return Object.assign(Object.assign({}, value), { paymentMethod, progressContext: normalizeProgressContext(value.progressContext, paymentMethod), lastTouchedAt: (_c = value.lastTouchedAt) !== null && _c !== void 0 ? _c : updatedAt });
}
function normalizeNotificationRecord(value) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const updatedAt = (_b = (_a = value.updatedAt) !== null && _a !== void 0 ? _a : value.createdAt) !== null && _b !== void 0 ? _b : (0, db_utils_1.nowIso)();
    const createdAt = (_c = value.createdAt) !== null && _c !== void 0 ? _c : updatedAt;
    return Object.assign(Object.assign({}, value), { eventType: isNotificationEventType(value.eventType) ? value.eventType : "reservation_request_received", templateKey: isNotificationEventType(value.templateKey) ? value.templateKey : "reservation_request_received", audience: isNotificationAudience(value.audience) ? value.audience : "guest", channel: isNotificationChannel(value.channel) ? value.channel : "internal", recipient: (_d = value.recipient) !== null && _d !== void 0 ? _d : "", title: (_e = value.title) !== null && _e !== void 0 ? _e : "Notification", body: (_f = value.body) !== null && _f !== void 0 ? _f : null, templateRef: (_g = value.templateRef) !== null && _g !== void 0 ? _g : null, status: isNotificationStatus(value.status) ? value.status : "pending", dedupeKey: (_h = value.dedupeKey) !== null && _h !== void 0 ? _h : `legacy-${value.id}`, payload: (_j = value.payload) !== null && _j !== void 0 ? _j : {}, reservationId: (_k = value.reservationId) !== null && _k !== void 0 ? _k : null, reservationToken: (_l = value.reservationToken) !== null && _l !== void 0 ? _l : null, paymentAttemptId: (_m = value.paymentAttemptId) !== null && _m !== void 0 ? _m : null, errorMessage: (_o = value.errorMessage) !== null && _o !== void 0 ? _o : null, sentAt: (_p = value.sentAt) !== null && _p !== void 0 ? _p : null, createdAt,
        updatedAt });
}
function createSeedFlats(now) {
    return [
        {
            id: "windsor",
            name: "Windsor Residence",
            nightlyRate: 150000,
            maxGuests: 6,
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "kensington",
            name: "Kensington Lodge",
            nightlyRate: 180000,
            maxGuests: 6,
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "mayfair",
            name: "Mayfair Suite",
            nightlyRate: 250000,
            maxGuests: 6,
            createdAt: now,
            updatedAt: now,
        },
    ];
}
function createSeedExtras(now) {
    return [
        { id: "airport", title: "Premium Airport Transfer", flatFee: 65000, createdAt: now, updatedAt: now },
        { id: "pantry", title: "Pantry Pre-Stocking", flatFee: 45000, createdAt: now, updatedAt: now },
        { id: "celebration", title: "Celebration Setup", flatFee: 75000, createdAt: now, updatedAt: now },
    ];
}
function createEmptyDatabaseState() {
    const now = (0, db_utils_1.nowIso)();
    return {
        flats: createSeedFlats(now),
        extras: createSeedExtras(now),
        reservations: [],
        availabilityBlocks: [],
        centralStockByItem: {},
        inventoryItems: [],
        inventoryTemplates: [],
        templateItems: [],
        flatInventory: [],
        stockMovements: [],
        flatReadiness: [],
        inventoryAlerts: [],
        maintenanceIssues: [],
        workerTasks: [],
        tourAppointments: [],
        paymentAttempts: [],
        transferVerifications: [],
        posCoordinations: [],
        reservationEvents: [],
        reservationNotifications: [],
        idempotencyKeys: [],
    };
}
async function ensureDataFile() {
    if ((0, node_fs_1.existsSync)(DATA_FILE_PATH)) {
        return;
    }
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(DATA_FILE_PATH), { recursive: true });
    const initialState = createEmptyDatabaseState();
    await (0, promises_1.writeFile)(DATA_FILE_PATH, JSON.stringify(initialState, null, 2), "utf8");
}
async function readDatabaseState() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    await ensureDataFile();
    const raw = await (0, promises_1.readFile)(DATA_FILE_PATH, "utf8");
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        throw new Error(`Booking database file is corrupt or unreadable at ${DATA_FILE_PATH}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return {
        flats: (_a = parsed.flats) !== null && _a !== void 0 ? _a : [],
        extras: (_b = parsed.extras) !== null && _b !== void 0 ? _b : [],
        reservations: ((_c = parsed.reservations) !== null && _c !== void 0 ? _c : []).map(normalizeReservationRecord),
        availabilityBlocks: (_d = parsed.availabilityBlocks) !== null && _d !== void 0 ? _d : [],
        centralStockByItem: (_e = parsed.centralStockByItem) !== null && _e !== void 0 ? _e : {},
        inventoryItems: (_f = parsed.inventoryItems) !== null && _f !== void 0 ? _f : [],
        inventoryTemplates: (_g = parsed.inventoryTemplates) !== null && _g !== void 0 ? _g : [],
        templateItems: (_h = parsed.templateItems) !== null && _h !== void 0 ? _h : [],
        flatInventory: (_j = parsed.flatInventory) !== null && _j !== void 0 ? _j : [],
        stockMovements: (_k = parsed.stockMovements) !== null && _k !== void 0 ? _k : [],
        flatReadiness: (_l = parsed.flatReadiness) !== null && _l !== void 0 ? _l : [],
        inventoryAlerts: (_m = parsed.inventoryAlerts) !== null && _m !== void 0 ? _m : [],
        maintenanceIssues: (_o = parsed.maintenanceIssues) !== null && _o !== void 0 ? _o : [],
        workerTasks: (_p = parsed.workerTasks) !== null && _p !== void 0 ? _p : [],
        tourAppointments: (_q = parsed.tourAppointments) !== null && _q !== void 0 ? _q : [],
        paymentAttempts: (_r = parsed.paymentAttempts) !== null && _r !== void 0 ? _r : [],
        transferVerifications: (_s = parsed.transferVerifications) !== null && _s !== void 0 ? _s : [],
        posCoordinations: (_t = parsed.posCoordinations) !== null && _t !== void 0 ? _t : [],
        reservationEvents: (_u = parsed.reservationEvents) !== null && _u !== void 0 ? _u : [],
        reservationNotifications: ((_v = parsed.reservationNotifications) !== null && _v !== void 0 ? _v : []).map(normalizeNotificationRecord),
        idempotencyKeys: (_w = parsed.idempotencyKeys) !== null && _w !== void 0 ? _w : [],
    };
}
async function writeDatabaseState(state) {
    await (0, promises_1.writeFile)(DATA_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
}
let databaseQueue = Promise.resolve();
async function readBookingDatabase() {
    return readDatabaseState();
}
async function withBookingDatabase(operation) {
    const queuedOperation = databaseQueue.then(async () => {
        const state = await readDatabaseState();
        const result = await operation(state);
        await writeDatabaseState(state);
        return result;
    });
    databaseQueue = queuedOperation.then(() => undefined, () => undefined);
    return queuedOperation;
}
function getDatabaseFilePath() {
    return DATA_FILE_PATH;
}
