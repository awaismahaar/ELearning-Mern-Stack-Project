"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
const catchAsyncError_1 = require("./../middlewares/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const order_model_1 = __importDefault(require("../models/order.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const nodeMailer_1 = __importDefault(require("../utils/nodeMailer"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
require('dotenv').config();
const stripe_1 = __importDefault(require("stripe"));
const redis_1 = require("../utils/redis");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
exports.createOrder = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const payment = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (payment.status !== "succeeded") {
                    return next(new ErrorHandler_1.default("Payment failed", 400));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        const course = await course_model_1.default.findById(courseId);
        const checkAlreadyExists = user?.courses.some(c => c._id.toString() === courseId);
        if (checkAlreadyExists) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 400));
        }
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 400));
        }
        const newOrder = new order_model_1.default({
            userId: user?._id,
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
        };
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, '../mails/order-mail.ejs'), orderMail);
        try {
            if (user) {
                await (0, nodeMailer_1.default)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-mail.ejs",
                    data: orderMail
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
        user?.courses.push(course._id);
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        await user?.save();
        // create notification
        await notification_model_1.default.create({
            userId: user?._id,
            title: "New Order",
            message: `You have a new order from ${course.name}`
        });
        course.purchased += 1;
        await course?.save();
        return res.status(200).json({
            success: true,
            order: newOrder
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all orders -> only for admin
exports.getAllOrders = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const orders = await order_model_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            orders
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.sendStripePublishableKey = (0, catchAsyncError_1.catchAsyncError)(async (req, res) => {
    return res.status(200).json({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});
// new Payment
exports.createPayment = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { amount } = req.body;
        const payment = await stripe.paymentIntents.create({
            amount,
            currency: 'USD',
            description: "Course Payment",
            metadata: {
                company: "ELearning"
            },
            automatic_payment_methods: {
                enabled: true
            }
        });
        return res.status(200).json({
            success: true,
            client_secret: payment.client_secret
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
