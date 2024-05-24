import busboy from "busboy";
import { Request, Response, NextFunction } from "express";

export const validateFileUpload = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const bb = busboy({ headers: req.headers });
    const MAX_FILE_COUNT = 5;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    let fileCount = 0;
    let totalFileSize = 0;
    let hasExceededLimit = false;

    bb.on("file", (name, file) => {
        fileCount++;

        // Check if the maximum number of files has been reached
        if (fileCount > MAX_FILE_COUNT) {
            console.error("Maximum number of files exceeded");
            hasExceededLimit = true;
            return file.resume(); // Discard the remaining data
        }

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
        });
    });

    bb.on("close", () => {
        if (hasExceededLimit) {
            return res.status(400).json({
                status: -1,
                message: "Limit exceeded",
                err: "Maximum number of files exceeded or total file size exceeds the limit",
            });
        }

        // Attach the busboy instance to the request object
        req.body = bb;
        next();
    });

    req.pipe(bb);
};
