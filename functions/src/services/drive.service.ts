import { google } from "googleapis";
import path from "path";
import fs from "fs";

const KEY_FILE_PATH = path.join(
    "fir-functions-9c002-firebase-adminsdk-fn49x-e30a8a6839.json"
);

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

export default class DriveService {
    constructor() {}

    uploadPdf = async (file) => {
        try {
            console.log("hello 2");
            const { data } = await google
                .drive({ version: "v3", auth: auth })
                .files.create({
                    media: {
                        mimeType: file.mimeType,
                        body: fs.createReadStream(file.path),
                    },
                    requestBody: {
                        name: file.originalname,
                        parents: ["1HyWYUFaaBJxKXZS4-8YvNDG3J5DDJll2"], //folder id in which file should be uploaded
                    },
                    fields: "id,name",
                });

            console.log(
                `File uploaded successfully -> ${JSON.stringify(data)}`
            );

            return { file_id: data.id, file_name: data.name };
        } catch (error) {
            return { status: -1, message: "failure", err: error.message };
        }
    };

    getAllFiles = async () => {
        const folderId = "1sbOZRoTLQjXuqPMSom78YjPG8DL3WpH5"; // Replace with your folder ID

        try {
            const response = await google
                .drive({ version: "v3", auth: auth })
                .files.list({
                    q: `'${folderId}' in parents and mimeType='application/pdf'`,
                    fields: "files(id, name, webContentLink)",
                });

            const files = response.data.files.map((file) => ({
                id: file.id,
                name: file.name,
                downloadLink: file.webContentLink,
            }));
            return files;
        } catch (error) {
            return error.message;
        }
    };
}
