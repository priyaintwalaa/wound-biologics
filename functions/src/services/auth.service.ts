import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { User, UserResponse } from "../models/user.js";
import {
    compareText,
    generateRandomText,
    hashRandomText,
} from "../utils/pwd.util.js";
import UserService from "./user.service.js";
import jwt from "jsonwebtoken";
import { UserMapper } from "../mappers/user.mapper.js";
import EmailService from "./email.service.js";
import CustomError from "../models/customError.js";
import OptService from "./otp.service.js";

export class AuthService {
    private userService: UserService;
    private otpService: OptService;

    constructor() {
        this.userService = new UserService();
        this.otpService = new OptService();
    }

    login = async (email: string, password: string) => {
        let user: User;
        try {
            user = await this.userService.getUserByEmail(email);
        } catch (err: any) {
            throw new CustomError("INVALID_CREDS", 401);
        }

        if (!user.isActive) {
            throw new CustomError("INACTIVE_USER", 401);
        }

        //Step1: If account is locked, then ask to contact system admin.
        if (user.isLocked) {
            throw new CustomError("ACCOUNT_LOCKED", 401);
        }
        const isUserAuthanticated = compareText(
            password,
            user.password.hash,
            user.password.salt
        );
        if (!isUserAuthanticated) {
            // Step2: Password is not matching so increase invalid attempt and update time.

            //On unlocking we need to reset this data.
            if (user.invalidAttempt) {
                user.invalidAttempt.count = ++user.invalidAttempt.count;
                user.invalidAttempt.lastAttemptTime =
                    FieldValue.serverTimestamp();
            } else {
                user.invalidAttempt = {
                    count: 1,
                    lastAttemptTime: FieldValue.serverTimestamp(),
                };
            }

            // Step3: If it's crossing expected number lock the account. And send info that account is locked
            if (
                user.invalidAttempt.count >
                Number(process.env.MAX_INVALID_ATTEMPT)
            ) {
                user.isLocked = true;
                await this.userService.updateUser(user);
                throw new CustomError("ACCOUNT_LOCKED", 401);
            }
            await this.userService.updateUser(user);
            throw new CustomError("INVALID_CREDS", 401);
        }
        const userMapper = new UserMapper();
        const userResponse: UserResponse =
            userMapper.generateUserResponse(user);
        const token = jwt.sign(
            userResponse,
            process.env.JWT_SECRET_KEY as jwt.Secret,
            {
                expiresIn: "1h",
            }
        );

        //Remove the invalid attempt if second try is with correct password.
        if (user.invalidAttempt) {
            (user.invalidAttempt as any) = FieldValue.delete();
            await this.userService.updateUser(user);
        }

        return { token, user: userResponse };
    };

    forgotPassword = async (email: string) => {
        const user: User = await this.userService.getUserByEmail(email);
        if (!user) throw new Error("USER_NOT_REGISTERED");

        //Step1 : Generate code and save it in database with hashed version
        const code = generateRandomText(5);
        const { hashedText, salt } = hashRandomText(code);

        const now = Timestamp.now();
        const twentyFourHoursFromNow = new Timestamp(
            now.seconds +
                (Number(process.env.OTP_EXPIRTY_IN_MINUTES) / 60) * 60 * 60,
            now.nanoseconds
        );

        //Step2: Save hash version of token in database
        user.resetPasswordToken = {
            hash: hashedText,
            expiredTime: twentyFourHoursFromNow,
            salt,
        };

        const userService = new UserService();
        await userService.updateUser(user);
        //Step3: Send link via email to user with token and userid
        const emailService = new EmailService();
        const mailOptions: any = {
            to: user.email,
            template: "forgot-password",
            subject: "Forgot Password OTP for Wound Biologics",
            context: {
                code,
                firstname: user.firstname || "",
                lastname: user.lastname || "",
                expiryInMinutes: process.env.OTP_EXPIRTY_IN_MINUTES,
            },
        };
        await emailService.sendMail(mailOptions);
    };

    verifyEmail = async (email: string) => {
        await this.userService.getUserByEmail(email);
    };

    sendOtp = async (email: string) => {
        const user: User = await this.userService.getUserByEmail(email);
        if (!user) throw new CustomError("USER_NOT_REGISTERED", 401);

        //Step1 : Generate code and save it in database with hashed version
        const code = generateRandomText(5);
        const { hashedText, salt } = hashRandomText(code);

        const now = Timestamp.now();
        const expiredTime = new Timestamp(
            now.seconds +
                (Number(process.env.OTP_EXPIRTY_IN_MINUTES) / 60) * 60 * 60,
            now.nanoseconds
        );

        //Step2: Save hash version of token in database
        user.currentOtp = {
            hash: hashedText,
            createdTime: FieldValue.serverTimestamp(),
            expiredTime,
            salt,
            isVerified: false,
        };

        await this.otpService.createOtp({
            isVerified:false,
            email,
            hash: hashedText,
            salt,
            createdTime: FieldValue.serverTimestamp(),
            expiredTime,
        });

        await this.userService.updateUser(user);
        //Step3: Send link via email to user with token and userid
        const emailService = new EmailService();
        const mailOptions: any = {
            to: user.email,
            template: "otp",
            subject: "Wound Biologics: One Time Password",
            context: {
                code,
                firstname: user.firstname || "",
                lastname: user.lastname || "",
                expiryInMinutes: process.env.OTP_EXPIRTY_IN_MINUTES,
            },
        };
        await emailService.sendMail(mailOptions);
    };

    verifyOtp = async (otp: string, email: string, target: string) => {
        //Step1: Check reset password token exist for user
        const user: User = await this.userService.getUserByEmail(email);
        if (!user) throw new CustomError("USER_NOT_REGISTERED", 401);

        if (!user.currentOtp?.hash)
            throw new CustomError("INVALID_VERIFY_REQUEST", 200);

        if (user.currentOtp.isVerified) {
            throw new CustomError("OTP_ALREDAY_VERIFIED", 200);
        }

        const expiryDate = user.currentOtp.expiredTime;
        const now = Timestamp.now();

        if (expiryDate.seconds < now.seconds) {
            throw new CustomError("EXPIRED_CODE", 403);
        }
        //Step2: Compare code from body and database with hash
        const isValid: boolean = compareText(
            otp,
            user.currentOtp.hash,
            user.currentOtp.salt
        );
        if (!isValid) throw new CustomError("INVALID_CODE", 403);
        if (target == "account-lockout") {
            (user.invalidAttempt as any) = FieldValue.delete();
            (user.currentOtp as any) = FieldValue.delete();
            user.isLocked = false;
        } else {
            user.currentOtp.isVerified = true;
        }
        await this.userService.updateUser(user);
        //Step4: Inform user that password updated successfully
        return;
    };

    resetPassword = async (email: string, newPassword: string) => {
        //Step1: Check reset password token exist for user
        const user: User = await this.userService.getUserByEmail(email);
        if (!user) throw new Error("USER_NOT_REGISTERED");

        if (!(user.currentOtp?.hash && user.currentOtp?.isVerified))
            throw new Error("INVALID_RESET_REQUEST");

        const expiryDate = user.currentOtp.expiredTime;
        const now = Timestamp.now();

        if (expiryDate.seconds < now.seconds) {
            throw new Error("EXPIRED_CODE");
        }

        //Step2: Update new password
        const { hashedText, salt } = hashRandomText(newPassword);
        user.password = { hash: hashedText, salt };
        // delete user.currentOtp;
        (user.currentOtp as any) = FieldValue.delete();
        const userService = new UserService();
        await userService.updateUser(user);
        //Step4: Inform user that password updated successfully
        return;
    };

    generateToken(userData: UserResponse) {
        const token = jwt.sign(
            userData,
            process.env.JWT_SECRET_KEY as jwt.Secret,
            {
                expiresIn: "1h",
            }
        );
        return token;
    }
}
