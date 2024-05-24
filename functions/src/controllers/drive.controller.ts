import { Request, Response } from "express";
import asyncHandler from "../utils/catchAsync.util.js";
import DriveService from "../services/drive.service.js";
// import os from "os";
// import fs from "fs";
// import { Readable } from "stream";
import stream from "stream";
import busboy from "busboy";
import { google } from "googleapis";
import path from "path";
const KEY_FILE_PATH = path.join(
    "fir-functions-9c002-firebase-adminsdk-fn49x-e30a8a6839.json"
);

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

export class DriveController {
    private driveService: DriveService;

    constructor() {
        this.driveService = new DriveService();
    }

    uploadPdf = asyncHandler(async (req: Request, res: Response) => {
        // const { file } = req;
        // console.log(file);
        // console.log(req.body);
        // const data = await this.driveService.uploadPdf(file);
        // return res.status(200).json({data,message:"Done"});

        try {
            const bb = busboy({ headers: req.headers });

            bb.on("file",async (name, file, info) => {
                const { filename, encoding, mimeType } = info;
                console.log(
                    `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
                    filename,
                    encoding,
                    mimeType
                );
                try {
                    // Create a new readable stream from the file data
                    const fileStream = new stream.PassThrough();

                    // Pipe the file data to the readable stream
                    file.pipe(fileStream);

                    // Upload the file to Google Drive
                    const { data } = await google
                        .drive({ version: "v3", auth: auth })
                        .files.create({
                            media: { mimeType: mimeType, body: fileStream },
                            requestBody: {
                                name: filename,
                                parents: ["1HyWYUFaaBJxKXZS4-8YvNDG3J5DDJll2"], // Replace with your desired folder ID
                            },
                            fields: "id,name",
                        });

                    console.log("File uploaded to Google Drive:", data);
                } catch (err) {
                    console.error("Error uploading file to Google Drive:", err);
                }
                file.on("data", (data) => {
                    console.log(`File [${name}] got ${data?.length} bytes`);
                }).on("close", () => {
                    console.log(`File [${name}] done`);
                });
            });
            bb.on("field", (name, val) => {
                console.log(`Field [${name}]: value: %j`, val);
            });
            bb.on("close", () => {
                console.log("Done parsing form!");
                res.status(200).send({ message: "Done parsing form!" });
            });

            bb.end(req.body);
        } catch (error) {
            console.log(error);
            res.json({ status: -1, message: "failure", err: error.message });
        }
    });

    getAllFiles = asyncHandler(async (req: Request, res: Response) => {
        const data = await this.driveService.getAllFiles();
        return res.status(200).json({ data, message: "Done" });
    });
}
