"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const userRouter = express_1.default.Router();
// registration
userRouter.post('/register', user_controller_1.Register);
// activate user account
userRouter.post("/activate-user", user_controller_1.ActivateUser);
// login user
userRouter.post("/login", user_controller_1.Login);
// logout user
userRouter.get("/logout", auth_1.isAuthenticated, user_controller_1.Logout);
// refresh token
userRouter.get("/refresh-token", user_controller_1.updateAccessToken);
// get user information
userRouter.get("/me", user_controller_1.updateAccessToken, auth_1.isAuthenticated, user_controller_1.getUserProfile);
// social authentication
userRouter.post("/social-auth", user_controller_1.socialAuth);
// update user
userRouter.put("/update-user", auth_1.isAuthenticated, user_controller_1.updateUserProfile);
// update password
userRouter.put("/update-password", auth_1.isAuthenticated, user_controller_1.updatePassword);
// update avatar
userRouter.put("/update-avatar", auth_1.isAuthenticated, user_controller_1.updateAvatar);
// get all users
userRouter.get("/get-all-users", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), user_controller_1.getAllUsers);
// update user role
userRouter.post("/update-user-role", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), user_controller_1.updateUserRole);
// delete user 
userRouter.delete("/delete-user/:id", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), user_controller_1.deleteUser);
exports.default = userRouter;
