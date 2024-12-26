import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthData } from "../utils/analytics.generator";
import User from "../models/user.model";
import Order from "../models/order.model";
import Course from "../models/course.model";

// generate last 12 months users data
export const userAnalytics = catchAsyncError(async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const users = await generateLast12MonthData(User);
        res.status(200).json({
            success: true,
            users
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
})

// generate last 12 months orders data
export const orderAnalytics = catchAsyncError(async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const orders = await generateLast12MonthData(Order);
        res.status(200).json({
            success: true,
            orders
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
})

// generate last 12 months courses data
export const coursesAnalytics = catchAsyncError(async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const courses = await generateLast12MonthData(Course);
        res.status(200).json({
            success: true,
            courses
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500));
    }
})