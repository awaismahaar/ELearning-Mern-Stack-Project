import express , {NextFunction, Request, Response} from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import connectDb from './utils/db';
import { ErrorMiddleware } from './middlewares/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.route';
import orderRouter from './routes/order.route';
import notificationRouter from './routes/notification.route';
import analyticsRouter from './routes/analytics.route';
import layoutRouter from './routes/layout.route';
import { rateLimit } from 'express-rate-limit';
require('dotenv').config();

export const app = express()

// connect to database
connectDb();

// body parser
app.use(express.json({limit : "50mb"}));
// cookie parser
app.use(cookieParser());
// cors -> cross origin resourse sharing
app.use(cors({
    origin : ['http://localhost:3000'],
    credentials : true,
}))

// limit api requests
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

// routes
app.use("/api/v1" , userRouter, courseRouter , orderRouter , notificationRouter , analyticsRouter , layoutRouter);

// route not found
app.all("*" , (req:Request, res:Response,next:NextFunction)=>{
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
})
app.use(limiter);

// error handling middleware
app.use(ErrorMiddleware);
