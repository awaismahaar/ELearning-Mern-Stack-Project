import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import Notification from "../models/notification.model";
import cron from "node-cron";

// get all notifications -> only for admin
export const getAllNotifications = catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const notifications = await Notification.find().sort({createdAt : -1})
        res.status(200).json({
            success : true,
            notifications
        })
    } catch (error:any) {
       return next(new ErrorHandler(error.message, 500))
    }
})

// update notification status -> only for admin
export const updateNotification = catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const notification = await Notification.findById(req.params.id);
        if(!notification){
            return next(new ErrorHandler("Notification not found", 404));
        }
        notification.status = "read";
        await notification.save();
        const notifications = await Notification.find().sort({createdAt : -1})
        res.status(200).json({
            success : true,
            notifications
        })
    } catch (error:any) {
       return next(new ErrorHandler(error.message, 500))
    }
})

// delete notifications
cron.schedule("0 0 0 * * *" , async ()=>{
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await Notification.deleteMany({status : "read" , createdAt : { $lt : thirtyDaysAgo }})
})