"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const ErrorMiddleware = (err, req, res, next) => {
    err.statusCode = res.statusCode || 500;
    err.message = err.message || "Internal server error!";
    // wrong mongodb id error
    if (err.name === "CastError") {
        err = new ErrorHandler_1.default(`Resource not found , invalid ${err.path}`, 400);
    }
    // duplicate key error
    if (err.code === 11000) {
        err = new ErrorHandler_1.default(`Duplicate ${Object.keys(err.keyValue)} found`, 400);
    }
    // jsonwebtoken error
    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler_1.default("Json web token is invalid", 401);
    }
    // expired jwt token error
    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler_1.default("Json web token is expired", 401);
    }
    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};
exports.ErrorMiddleware = ErrorMiddleware;
