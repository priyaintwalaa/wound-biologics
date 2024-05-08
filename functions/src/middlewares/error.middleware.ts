import { NextFunction, Request, Response } from "express";
import CustomError from "../models/customError.js";
import { logger } from "firebase-functions";
const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error(err);
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
};

export default errorHandler;
