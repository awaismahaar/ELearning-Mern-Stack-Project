import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleware = (err:any , req:Request,res:Response,next:NextFunction)=>{
    err.statusCode = res.statusCode || 500;
    err.message = err.message || "Internal server error!";

    // wrong mongodb id error
    if (err.name === "CastError") {
       err = new ErrorHandler(`Resource not found , invalid ${err.path}`,400) 
    }
    // duplicate key error
    if(err.code === 11000){
        err = new ErrorHandler(`Duplicate ${Object.keys(err.keyValue)} found`,400)
    }
    // jsonwebtoken error
    if(err.name === "JsonWebTokenError"){
        err = new ErrorHandler("Json web token is invalid",401)
    }
    // expired jwt token error
    if(err.name === "TokenExpiredError"){
        err = new ErrorHandler("Json web token is expired",401)
    }
    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}