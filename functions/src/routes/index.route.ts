import express, { Router } from "express";
import authRouter from "./auth.route.js";
import userRouter from "./user.route.js";
import companyRouter from "./company.route.js";
import roleRouter from "./role.route.js";
import orderRouter from "./order.route.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import manufacturerRouter from "./manufacturer.route.js";
import patientRouter from "./patient.route.js";
import auditLogsRouter from "./auditlogs.route.js";
import driveRouter from "./drive.route.js";

const indexRouter: Router = express.Router();

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", userRouter);
indexRouter.use("/drive", driveRouter);
indexRouter.use(verifyToken);
indexRouter.use("/companies", companyRouter);
indexRouter.use("/manufacturers", manufacturerRouter);
indexRouter.use("/roles", roleRouter);
indexRouter.use("/orders", orderRouter);
indexRouter.use("/patients", patientRouter);
indexRouter.use("/auditlogs", auditLogsRouter);

export default indexRouter;
