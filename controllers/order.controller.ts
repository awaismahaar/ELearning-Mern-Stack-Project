import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from './../middlewares/catchAsyncError';
import ErrorHandler from '../utils/ErrorHandler';
import Order, { IOrder } from '../models/order.model';
import User from '../models/user.model';
import Course from '../models/course.model';
import ejs from 'ejs'
import path from 'path'
import sendEmail from '../utils/nodeMailer';
import Notification from '../models/notification.model';
require('dotenv').config();
import Stripe from 'stripe';
import { redis } from '../utils/redis';
const stripe = new Stripe (process.env.STRIPE_SECRET_KEY as string);
export const createOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as IOrder;
        if(payment_info){
            if("id" in payment_info){
                const paymentIntentId = payment_info.id;
                const payment = await stripe.paymentIntents.retrieve(paymentIntentId);
                if(payment.status !== "succeeded"){
                    return next(new ErrorHandler("Payment failed", 400));
                }
            }
        }
        
        const user = await User.findById(req.user?._id);
        const course = await Course.findById(courseId);
        const checkAlreadyExists = user?.courses.some(c => c._id.toString() === courseId)
        if (checkAlreadyExists) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }
        if (!course) {
            return next(new ErrorHandler("Course not found", 400));
        }
        const newOrder = new Order({
            userId : user?._id,
            courseId,
            payment_info
        });
        await newOrder.save();
        const orderMail = {
            order: {
                orderId: newOrder._id.toString().slice(0, 6),
                courseName: course.name,
                price: course.price,
                date: new Date().toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }),
            }
        }
        const html = await ejs.renderFile(path.join(__dirname, '../mails/order-mail.ejs'), orderMail);
        try {
            if (user) {
                await sendEmail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-mail.ejs",
                    data: orderMail
                })
            }

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
        user?.courses.push(course._id);
        await redis.set(req.user?._id as string, JSON.stringify(user));
        await user?.save();

        // create notification
        await Notification.create({
            userId : user?._id,
            title : "New Order",
            message : `You have a new order from ${course.name}`
        })
        course.purchased += 1;
        await course?.save();
        return res.status(200).json({
            success: true,
            order: newOrder
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// get all orders -> only for admin
export const getAllOrders = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await Order.find().sort({createdAt : -1})
        return res.status(200).json({
            success: true,
            orders
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

export const sendStripePublishableKey = catchAsyncError(async (req: Request, res: Response) => {
    return res.status(200).json({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    })
})

// new Payment
export const createPayment = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount } = req.body;
        const payment = await stripe.paymentIntents.create({
            amount,
            currency: 'USD',
            description: "Course Payment",
            metadata : {
                company : "ELearning"
            },
            automatic_payment_methods : {
                enabled : true
            }
        })
        return res.status(200).json({
            success: true,
            client_secret : payment.client_secret
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})
