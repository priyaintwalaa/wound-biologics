import { Request, Response } from "express";
import asyncHandler from "../utils/catchAsync.util.js";
import DriveService from "../services/drive.service.js";
import { CustomRequest } from "../models/customRequest.js";

export class DriveController {
    private driveService: DriveService;

    constructor() {
        this.driveService = new DriveService();
    }

    uploadPdf = asyncHandler(async (req: CustomRequest, res: Response) => {
        console.log("hello ");
        const dul = req.body;
        console.log(dul,"dulll");
        const {file} = req;
        const data = await this.driveService.uploadPdf(file);
        return res.status(200).json({data,message:"Done"});
    });

    getAllFiles = asyncHandler(async (req: Request, res: Response) => {
        const data = await this.driveService.getAllFiles();
        return res.status(200).json({data,message:"Done"});
    });
}
