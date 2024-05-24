import express, { Router } from "express";
import { DriveController } from "../controllers/drive.controller.js";

const driveRouter: Router = express.Router();
const driveController: DriveController = new DriveController();

driveRouter.post("/",driveController.uploadPdf);

driveRouter.get("/", driveController.getAllFiles);

export default driveRouter;

// import Multer from "multer";
// import os from "os";
// import Busboy from 'busboy';
// const storage = Multer.diskStorage({
//     destination: os.tmpdir(),
//     filename: (req, file, callback) => callback(null, `${file.originalname}`),
// });

// const upload = Multer({
//     storage: Multer.memoryStorage(),
//     limits: {
//         fileSize: 10 * 1024 * 1024, // No larger than 10mb
//         fieldSize: 10 * 1024 * 1024, // No larger than 10mb
//     },
// });

// const upload = Multer({
//     storage: storage,
// });
