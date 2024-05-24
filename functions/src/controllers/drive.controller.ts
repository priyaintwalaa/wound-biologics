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
        try {
            const bb = busboy({ headers: req.headers });
            const fileList: { filename: string; stream: stream.PassThrough }[] =
                [];
            let totalFileSize = 0;
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            let hasExceededLimit = false;

            bb.on("file", async (name, file, info) => {
                const { filename, encoding, mimeType } = info;
                console.log(
                    `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
                    filename,
                    encoding,
                    mimeType
                );

                // Check if the maximum number of files has been reached
                if (fileList.length >= 5) {
                    console.error("Maximum number of files exceeded");
                    hasExceededLimit = true;
                    return file.resume(); // Discard the remaining data
                }

                // Create a new readable stream from the file data
                const fileStream = new stream.PassThrough();

                // Store the file information in the list
                fileList.push({ filename, stream: fileStream });

                // Pipe the file data to the readable stream
                file.pipe(fileStream);

                // Track the file size
                let fileSize = 0;
                file.on("data", (chunk) => {
                    fileSize += chunk.length;
                    totalFileSize += chunk.length;

                    // Check if the total file size exceeds the limit
                    if (totalFileSize > MAX_FILE_SIZE) {
                        console.error("Total file size exceeds the limit");
                        hasExceededLimit = true;
                        return file.resume(); // Discard the remaining data
                    }

                    console.log(`File [${name}] got ${chunk.length} bytes`);
                }).on("close", () => {
                    console.log(
                        `File [${name}] done (size: ${fileSize} bytes)`
                    );
                });
            });

            bb.on("field", (name, val) => {
                console.log(`Field [${name}]: value: %j`, val);
            });

            bb.on("close", async () => {
                console.log("Done parsing form!");

                // Check if any limit was exceeded
                if (hasExceededLimit) {
                    return res.status(400).json({
                        status: -1,
                        message: "Limit exceeded",
                        err: "Maximum number of files exceeded or total file size exceeds the limit",
                    });
                }

                // Upload the files to Google Drive
                for (const { filename, stream } of fileList) {
                    try {
                        const { data } = await google
                            .drive({ version: "v3", auth: auth })
                            .files.create({
                                media: {
                                    mimeType: "application/pdf",
                                    body: stream,
                                },
                                requestBody: {
                                    name: filename,
                                    parents: [
                                        "1HyWYUFaaBJxKXZS4-8YvNDG3J5DDJll2",
                                    ], // Replace with your desired folder ID
                                },
                                fields: "id,name",
                            });
                        console.log("File uploaded to Google Drive:", data);
                    } catch (err) {
                        console.error(
                            "Error uploading file to Google Drive:",
                            err
                        );
                    }
                }

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
