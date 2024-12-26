import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { Secret } from 'jsonwebtoken'
import { redis } from "../utils/redis";

// authenticate user middleware
export const isAuthenticated = catchAsyncError(async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const access_token = req.cookies.access_token;
        if(!access_token){
            return next(new ErrorHandler("Please login to access this resource", 401))
        }
        // verify token
        const decoded = jwt.verify(access_token , process.env.ACCESS_TOKEN_SECRET as Secret)
        if(!decoded){
            return next(new ErrorHandler("Invalid access token", 401))
        }
        const user = await redis.get(decoded.id);
        if(!user){
            return next(new ErrorHandler("Access token expired session", 401))
        }
        req.user = JSON.parse(user);
        next();
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// validate user role
export const validateUserRole = (...roles: string[]) =>{
    return (req:Request,res:Response,next:NextFunction) => {
        if(!roles.includes(req.user?.role as any)){
            return next(new ErrorHandler(`Role : ${req.user?.role} is not allowed to access this resource`, 403))
        }
        next();
    }
}