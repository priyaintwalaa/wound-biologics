import { Response } from "express";

import AuditLogService from "../services/audit-log.service.js";
import { ExtendedExpressRequest } from "../models/extendedExpressRequest.js";
import { Roles } from "../constants/enums.js";
import CustomResponse from "../models/customResponse.js";
// import { AuditLog } from "../models/auditLog.js";

export class AuditLogsController {
    private auditLogService: AuditLogService;

    constructor() {
        this.auditLogService = new AuditLogService();
    }

    getAuditLogs = async (req: ExtendedExpressRequest, res: Response) => {
        let auditLog;
        console.log("in controller");
        console.log(req.user.role === Roles.SYSTEM_ADMIN);
        if (req.user.role === Roles.SYSTEM_ADMIN) {
            console.log("in if condition controler");
            auditLog = await this.auditLogService.getAuditLogs();
        }else{
            auditLog = await this.auditLogService.getAuditLogsById(
                req.params.companyId,
                req.params.userId
            );
        }
        return res.status(200).json(new CustomResponse(true, null, auditLog));
    };
}
