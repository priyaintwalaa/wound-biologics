import { FieldValue } from "firebase-admin/firestore";
import { firebaseDB } from "../config/firebase.config.js";
import { FIREBASE_CONSTANTS } from "../constants/firebase.js";
import { User, UserResponse } from "../models/user.js";
import { generateRandomText, hashRandomText } from "../utils/pwd.util.js";
import { logger } from "firebase-functions";
import EmailService from "./email.service.js";
import { UserMapper } from "../mappers/user.mapper.js";
import { AuthService } from "./auth.service.js";
import { ERROR_MESSAGES } from "../constants/error.js";
import { client } from "../config/typesense.config.js";
import { schema } from "../typeSenseCollection/user.js";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
// import PDFLib from "pdf-lib";
// const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
// const { imageBytes } = PDFLib;

const __dirname = path.resolve();
// import pdfParse from "pdf-parse";

const usersCollection = firebaseDB.collection(
    FIREBASE_CONSTANTS.FIRESTORE.USERS
);

export default class UserService {
    constructor() {}

    getUserById = async (userId: string) => {
        const docRef = usersCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error(ERROR_MESSAGES.USER.USER_NOT_EXISTS);
        } else {
            return doc.data() as User;
        }
    };

    getUserByEmail = async (email: string) => {
        const docRef = usersCollection;
        const snapshot = await docRef.where("email", "==", email).get();
        if (snapshot.empty) {
            console.log("No matching documents.");
            throw new Error(ERROR_MESSAGES.USER.USER_NOT_REGISTERED);
        }
        const user = snapshot.docs[0].data() as User;
        user.id = snapshot.docs[0].id;
        return user;
    };

    getAllUsers = async () => {
        const usersRef = usersCollection;
        const snapshot = await usersRef.where("role", "==", true).get();
        if (snapshot.empty) {
            console.log("No matching documents.");
            return;
        }
        snapshot.forEach((doc) => {
            console.log(doc.id, "=>", doc.data());
        });
    };

    createUser = async (
        user: User,
        isSuperTest: boolean = false
    ): Promise<{ [key: string]: any }> => {
        const isUserExists: boolean = await this.userExists(user.email);
        if (isUserExists) throw new Error(ERROR_MESSAGES.USER.USER_EXISTS);
        let password;
        if (isSuperTest) {
            password = process.env.TEST_USER_PWD;
        } else {
            password = generateRandomText(10);
            process.env.NODE_ENV == "local" &&
                logger.info(`Generated Rnadom Password--- ${password}`);
        }

        const { hashedText, salt } = hashRandomText(password);
        user.password = { hash: hashedText, salt };

        const docRef = await usersCollection.add({
            ...user,
            isActive: true,
            createdAt: FieldValue.serverTimestamp(),
        });

        const collections = await client.collections().retrieve();
        const collectionNames = collections.map(
            (collection) => collection.name
        );
        if (!collectionNames.includes("users")) {
            await client.collections().create(schema);
        }
        const docData = await docRef.get();

        await client.collections("users").documents().import([docData.data()]);
        return { id: docRef.id, password };
    };

    updateUser = async (user: User) => {
        const docRef = usersCollection.doc(user.id);
        await docRef.update({ ...user });
    };

    deleteUser = async (userId: string) => {
        const docRef = usersCollection.doc(userId);
        await docRef.delete();
    };

    getToken = async (userId: string) => {
        const user: User = await this.getUserById(userId);
        const userMapper = new UserMapper();
        const userResponse: UserResponse =
            userMapper.generateUserResponse(user);

        const authService = new AuthService();
        return authService.generateToken(userResponse);
    };

    getNames = async (name: any) => {
        console.log(name, "name in service");
        const searchParameters = {
            q: name,
            query_by: "firstname",
            // sort_by:"createdAt:desc"
        };
        const result = await client
            .collections(FIREBASE_CONSTANTS.FIRESTORE.USERS)
            .documents()
            .search(searchParameters);
        return result.hits;
    };

    createPDFGenerate = async (user: User) => {
        try {
            const pdfBytes = fs.readFileSync(
                "/home/bacancy/Documents/Wound-biologics'/wb-backend-priya/functions/pdfToChange.pdf"
            );

            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            fields.forEach((field) => {
                const fieldName = field.getName();
                console.log(fieldName, "feildName");
            });

            // Fill out the form fields
            form.getTextField("PatientName").setText(
                user.firstname + " " + user.lastname
            );

            // Add signature
            // const signatureField = form.getSignature("Signature");
            const marioImageBytes = fs.readFileSync(
                "/home/bacancy/Documents/Wound-biologics'/wb-backend-priya/functions/nguy-ecnh-nguyen-van-binh-signature-png-5.png"
            );
            const marioImage = await pdfDoc.embedPng(marioImageBytes);

            const imagePage = pdfDoc.getPage(0);

            imagePage.drawImage(marioImage, {
                x: 90,
                y: 80,
                width: 40,
                height: 40,
            });

            // form.getTextField("Signature").setImage(marioImage);

            // Serialize the PDF with the filled form fields
            const pdfBytes1 = await pdfDoc.save();

            // Create the 'pdfs' folder if it doesn't exist
            const pdfsDir = path.join(__dirname, "pdfs");
            if (!fs.existsSync(pdfsDir)) {
                fs.mkdirSync(pdfsDir);
            }

            // Save the updated PDF in the 'pdfs' folder
            const filePath = path.join(pdfsDir, "filled-out.pdf");
            fs.writeFileSync(filePath, pdfBytes1);
        } catch (error) {
            return error.message;
        }
    };

    userExists = async (email: string): Promise<boolean> => {
        const docRef = usersCollection;
        const snapshot = await docRef.where("email", "==", email).get();
        return !snapshot.empty;
    };

    sendCredsEmailToUser = async ({
        firstname,
        lastname,
        password,
        toEmailAddress,
    }: {
        firstname: string;
        lastname: string;
        password: string;
        toEmailAddress: string;
    }) => {
        //Step3: Send email with temp creds to system admin email
        const emailService = new EmailService();
        const mailOptions: object = {
            to: toEmailAddress,
            template: "welcome",
            subject: "Welcome to the Wound Biologics!",
            context: {
                password,
                firstname: firstname || "",
                lastname: lastname || "",
            },
        };
        await emailService.sendMail(mailOptions);
    };
}
