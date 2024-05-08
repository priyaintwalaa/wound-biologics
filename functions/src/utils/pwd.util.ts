import crypto from "crypto";
import { logger } from "firebase-functions";

export function generateRandomText(length: number) {
    return crypto.randomBytes(length).toString("hex").substring(0, length);
}

export function hashRandomText(text: string) {
    try {
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedText = crypto
            .pbkdf2Sync(text, salt, 1000, 64, "sha512")
            .toString("hex");
        return { salt, hashedText };
    } catch (err: any) {
        logger.error("Error while hashing text", err.message);
        throw new Error("HASH_TEXT_ERR");
    }
}

export function compareText(
    plainText: string,
    exisitingHash: string,
    salt: string
) {
    try {
        const hashOfPlainText = crypto
            .pbkdf2Sync(plainText, salt, 1000, 64, "sha512")
            .toString("hex");
        return hashOfPlainText === exisitingHash;
    } catch (err: any) {
        logger.error("Error while compare text", err.message);
        throw new Error("COMPARE_TEXT_ERR");
    }
}
