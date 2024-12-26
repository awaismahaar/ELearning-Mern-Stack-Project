"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserRole = exports.isAuthenticated = void 0;
const catchAsyncError_1 = require("./catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../utils/redis");
// authenticate user middleware
exports.isAuthenticated = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const access_token = req.cookies.access_token;
        if (!access_token) {
            return next(new ErrorHandler_1.default("Please login to access this resource", 401));
        }
        // verify token
        const decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            return next(new ErrorHandler_1.default("Invalid access token", 401));
        }
        const user = await redis_1.redis.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler_1.default("Access token expired session", 401));
        }
        req.user = JSON.parse(user);
        next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// validate user role
const validateUserRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return next(new ErrorHandler_1.default(`Role : ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
exports.validateUserRole = validateUserRole;
