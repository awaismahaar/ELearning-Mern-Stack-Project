"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateAvatar = exports.updatePassword = exports.updateUserProfile = exports.socialAuth = exports.getUserProfile = exports.updateAccessToken = exports.Logout = exports.Login = exports.ActivateUser = exports.Register = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const nodeMailer_1 = __importDefault(require("../utils/nodeMailer"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
exports.Register = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password, avatar } = req.body;
        // validation
        if (!name || !email || !password) {
            return next(new ErrorHandler_1.default("Please provide all fields", 400));
        }
        // check if email already exists
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        // create new user
        const user = {
            name,
            email,
            password
        };
        // activation Token
        const activationToken = createActivateToken(user);
        const activationCode = activationToken.activationCode;
        const data = {
            user: { name: user.name },
            activationCode
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            (0, nodeMailer_1.default)({
                email: email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data
            });
            return res.status(200).json({
                success: true,
                message: `Please check your email ${email} to activate your account`,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
const createActivateToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, process.env.ACTIVATION_TOKEN_SECRET, { expiresIn: '5m' });
    return {
        token,
        activationCode
    };
};
exports.ActivateUser = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { activate_token, activate_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activate_token, process.env.ACTIVATION_TOKEN_SECRET);
        if (activate_code !== newUser.activationCode) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const isAlreadyExist = await user_model_1.default.findOne({ email });
        if (isAlreadyExist) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        const user = new user_model_1.default({ name, email, password });
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Account activated successfully",
            user: user.toObject()
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.Login = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        const user = await user_model_1.default.findOne({ email }).select('+password');
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 401));
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 401));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// logout user
exports.Logout = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        // delete from redis
        await redis_1.redis.del(req.user?._id);
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// update access token
exports.updateAccessToken = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const refresh_token = req.cookies.refresh_token;
        if (!refresh_token) {
            return next(new ErrorHandler_1.default("No refresh token provided", 401));
        }
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        if (!decoded) {
            return next(new ErrorHandler_1.default("Invalid refresh token", 401));
        }
        // check if user exists in redis
        const cachedUser = await redis_1.redis.get(decoded.id);
        if (!cachedUser) {
            return next(new ErrorHandler_1.default("User not found , Please again login", 401));
        }
        // generate new access token
        const user = JSON.parse(cachedUser);
        const accessToken = jsonwebtoken_1.default.sign({ id: user?._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user?._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get user information
exports.getUserProfile = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const id = req.user?._id;
        if (!id) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        (0, user_service_1.getUserById)(id, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// social auth
exports.socialAuth = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, avatar } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            const newUser = await user_model_1.default.create({ name, email, avatar });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
        else {
            (0, jwt_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.updateUserProfile = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { name } = req.body;
        const user = await user_model_1.default.findById(req.user?._id);
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        // update user from redis
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: user?.toObject()
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.updatePassword = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await user_model_1.default.findById(req.user?._id).select("+password");
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default("User password not found", 400));
        }
        const isMatch = await user?.comparePassword(oldPassword);
        if (!isMatch) {
            return next(new ErrorHandler_1.default("Invalid old password", 400));
        }
        user.password = newPassword;
        await user?.save();
        // update user from redis
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.updateAvatar = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const user = await user_model_1.default.findById(req.user?._id);
        if (avatar && user) {
            if (user?.avatar?.public_id) {
                await cloudinary_1.default.uploader.destroy(user?.avatar?.public_id);
                const myCloud = await cloudinary_1.default.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            }
            else {
                const myCloud = await cloudinary_1.default.uploader.upload(avatar, {
                    folder: "avatars",
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            }
        }
        await user?.save();
        // update data from redis
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "Avatar updated successfully",
            user: user?.toObject()
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all users -> only for admin
exports.getAllUsers = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const users = await user_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// update user role -> only for admin
exports.updateUserRole = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (user) {
            user.role = role;
            await user?.save();
            // update data from redis
            await redis_1.redis.set(user._id, JSON.stringify(user));
            res.status(200).json({
                success: true,
                message: "User role updated successfully",
                user: user?.toObject()
            });
        }
        else {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// delete user -> only for admin
exports.deleteUser = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 400));
        }
        await user.deleteOne({ id });
        // delete from redis
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
