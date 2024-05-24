import { Request, Response } from "express";
import asyncHandler from "../utils/catchAsync.util.js";
import DriveService from "../services/drive.service.js";
// import os from "os";
// import fs from "fs";
import { Readable } from "stream";
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

            bb.on("file", async (name, file, info) => {
                const { filename, encoding, mimeType } = info;
                console.log(
                    `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
                    filename,
                    encoding,
                    mimeType
                );

                const buffers = [];

                file.on("data", (data) => {
                    buffers.push(data);
                });

                file.on("end", async () => {
                    const fileBuffer = Buffer.concat(buffers);
                    const fileStream = Readable.from(fileBuffer); // Create a readable stream from the Buffer

                    const { data } = await google
                        .drive({ version: "v3", auth: auth })
                        .files.create({
                            media: {
                                mimeType: mimeType,
                                body: fileStream, // Pass the readable stream as the request body
                            },
                            requestBody: {
                                name: filename,
                                parents: ["1HyWYUFaaBJxKXZS4-8YvNDG3J5DDJll2"], //folder id in which file should be uploaded
                            },
                            fields: "id,name",
                        });

                    console.log(
                        `File uploaded successfully -> ${JSON.stringify(data)}`
                    );
                    res.json({
                        status: 1,
                        message: "success",
                        file_id: data.id,
                        file_name: data.name,
                    });
                });
            });

            bb.on("close", () => {
                console.log("Done parsing form!");
            });

            req.pipe(bb);
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
