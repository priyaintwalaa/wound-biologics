import { Request, Response } from "express";
import UserService from "../services/user.service.js";
import { Roles } from "../constants/enums.js";
import { User } from "../models/user.js";
import CustomResponse from "../models/customResponse.js";
import { UserMapper } from "../mappers/user.mapper.js";
import CustomError from "../models/customError.js";
import asyncHandler from "../utils/catchAsync.util.js";
import { ExtendedExpressRequest } from "../models/extendedExpressRequest.js";
import { ERROR_MESSAGES } from "../constants/error.js";

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    getUser = asyncHandler(async (req: Request, res: Response) => {
        const user: User = await this.userService.getUserById(req.params.id);
        const userMapper = new UserMapper();
        const userResponse = userMapper.generateUserResponse(user);
        return res
            .status(200)
            .json(new CustomResponse(true, null, userResponse));
    });

    createUser = asyncHandler(async (req: Request, res: Response) => {
        console.log(req.body);
        const user: User = req.body;
        const { id, password, typseSenseData } =
            await this.userService.createUser(user);
        await this.userService.sendCredsEmailToUser({
            firstname: user.firstname,
            lastname: user.lastname,
            toEmailAddress: user.email,
            password,
        });
        const customResponse = new CustomResponse(
            true,
            "User created successfully",
            {
                id,
                typseSenseData,
            }
        );
        return res.status(200).json({
            customResponse,
            audit: {
                action: "user.create",
            },
        });
    });

    createSystemAdmin = asyncHandler(
        async (req: ExtendedExpressRequest, res: Response) => {
            //Step1: Allow only if have valid API key to create system admin
            if (req.headers["x-api-key"] != process.env.SYSTEM_ADMIN_KEY) {
                throw new CustomError(
                    ERROR_MESSAGES.MIDDLEWARE.UNAUTHORIZED,
                    401
                );
            }
            //Step2: Add system admin in DB
            const user: User = req.body;
            user.role = Roles.SYSTEM_ADMIN;
            const { password } = await this.userService.createUser(
                user,
                req.isSuperTest
            );

            //Step3: Send email with temp creds to system admin email
            await this.userService.sendCredsEmailToUser({
                firstname: user.firstname,
                lastname: user.lastname,
                toEmailAddress: user.email,
                password,
            });

            const userMapper = new UserMapper();
            const userResponse = userMapper.generateUserResponse(user);
            const customResponse = new CustomResponse(
                true,
                "System admin created succesfully",
                userResponse
            );
            return res.status(200).json({
                customResponse,
                audit: {
                    action: "system-admin.create",
                },
            });
        }
    );

    updateUser = asyncHandler(async (req: Request, res: Response) => {
        console.log(req.body);
        const user: User = req.body;
        user.id = req.params.id;
        await this.userService.updateUser(user);
        const customResponse = new CustomResponse(
            true,
            "User updated succesfully",
            user
        );
        return res.status(200).json({
            customResponse,
            audit: {
                action: "user.update",
            },
        });
    });

    // updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         console.log(req.body.isActive);
    //         await this.userService.updateUserStatus(req.params.id, req.body.isActive);
    //         return res.status(200).json(new CustomResponse(true, "User status updated succesfully", {}));
    //     } catch (err:any) {
    //         next(err);
    //     }
    // }

    deleteUser = asyncHandler(async (req: Request, res: Response) => {
        console.log(req.body);
        await this.userService.deleteUser(req.params.id);
        const customResponse = new CustomResponse(
            true,
            "User deleted succesfully",
            {}
        );
        return res.status(200).json({
            customResponse,
            audit: {
                action: "user.delete",
            },
        });
    });

    getToken = asyncHandler(async (req: Request, res: Response) => {
        console.log(req.body);
        const token = await this.userService.getToken(req.params.id);
        return res.status(200).json(new CustomResponse(true, "", { token }));
    });

    getNames = asyncHandler(async (req: Request, res: Response) => {
        console.log("name in controller", req.query.name);
        const names = await this.userService.getNames(req.query.name);
        console.log("namesin controller after querty", names);
        return res.status(200).json(new CustomResponse(true, "", { names }));
    });

    generatePDF = asyncHandler(async (req: Request, res: Response) => {
        try {
            const data = await this.userService.generatePDF(req.body);
            return res.status(200).json(new CustomResponse(true, "", { data }));
        } catch (error) {
            console.log(error.message, "in controller");
        }
    });
}
