import { firebaseDB } from "../config/firebase.config.js";
import { FIREBASE_CONSTANTS } from "../constants/firebase.js";
import { AuditLog } from "../models/auditLog.js";

const auditLogCollection = firebaseDB.collection(
    FIREBASE_CONSTANTS.FIRESTORE.AUDIT_LOGS
);

export default class AuditLogService {
    constructor() {}

    addAuditLog = async (auditLog: AuditLog) => {
        const res = await auditLogCollection.add(auditLog);
        return res.id;
    };
}
