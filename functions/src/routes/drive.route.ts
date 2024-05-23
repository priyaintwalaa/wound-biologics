import express, { Router } from "express";
import { DriveController } from "../controllers/drive.controller.js";
import multer from "multer";
import os from "os";

const storage = multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, callback) => callback(null, `${file.originalname}`),
});

const upload = multer({
    storage: storage,
});

const driveRouter: Router = express.Router();
const driveController: DriveController = new DriveController();

driveRouter.post("/", upload.single("file"), driveController.uploadPdf);
driveRouter.get("/", driveController.getAllFiles);

export default driveRouter;
