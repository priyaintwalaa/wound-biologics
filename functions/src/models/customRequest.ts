import { Request } from "express";
import { MulterFile } from "multer";

export interface CustomRequest extends Request {
    file?: MulterFile | null;
}
