/* eslint-disable quotes */
import express, { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { verifyRole, verifyToken } from "../middlewares/auth.middleware.js";
import { Roles } from "../constants/enums.js";
import { userRegistrationSchema } from "../schemas/zod.schema.js";
import { validateData } from "../middlewares/validation.middleware.js";
// import multer from "multer";

// const upload = multer({ dest: "uploads/" });

const userRouter: Router = express.Router();
const userController: UserController = new UserController();

//Create first system admin
userRouter.post(
    "/system-admin",
    validateData(userRegistrationSchema),
    userController.createSystemAdmin
);
userRouter.post("/pdf-generate", userController.createPDFGenerate);
userRouter.get("/", userController.getNames);
userRouter.use(verifyToken);
userRouter.use(verifyRole([Roles.SYSTEM_ADMIN]));
userRouter.get("/:id", userController.getUser);
//Create users from system admin's account, need to restrict
userRouter.post(
    "/",
    validateData(userRegistrationSchema),
    userController.createUser
);
userRouter.put("/:id", userController.updateUser);
userRouter.put("/upload/", userController.updateUser);

// userRouter.put('/:id/status', userController.updateUserStatus);
userRouter.delete("/:id", userController.deleteUser);
userRouter.get("/:id/token", userController.getToken);

export default userRouter;
