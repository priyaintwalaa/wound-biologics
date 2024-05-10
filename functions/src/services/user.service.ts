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
        const search = {
            q: `${name}`,
            query_by: "firstname",
        };
        client
            .collections(FIREBASE_CONSTANTS.FIRESTORE.USERS)
            .documents()
            .search(search)
            .then((searchResults) => {
                console.log(searchResults.hits);
            });
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
