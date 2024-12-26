import { NextFunction, Request, Response } from "express"
import { catchAsyncError } from "../middlewares/catchAsyncError"
import ErrorHandler from "../utils/ErrorHandler"
import User, { IUser } from "../models/user.model"
import jwt, { Secret } from 'jsonwebtoken'
import ejs from 'ejs'
import path from 'path'
import sendEmail from "../utils/nodeMailer"
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt"
import { redis } from "../utils/redis"
import { getUserById } from "../services/user.service"
import cloudinary from "../utils/cloudinary"
import { log } from "console"

// register user
interface IRegistration {
    name: string
    email: string
    password: string
    avatar?: string
}

export const Register = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, avatar } = req.body as IRegistration;
        // validation
        if (!name || !email || !password) {
            return next(new ErrorHandler("Please provide all fields", 400))
        }
        // check if email already exists
        const isEmailExist = await User.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler("Email already exists", 400))
        }
        // create new user
        const user = {
            name,
            email,
            password
        }
        // activation Token
        const activationToken = createActivateToken(user);
        const activationCode = activationToken.activationCode;
        const data = {
            user : {name : user.name},
            activationCode
        }
        const html = await ejs.renderFile(path.join(__dirname , "../mails/activation-mail.ejs") , data);
        try {
            sendEmail({
                email : email,
                subject : "Activate your account",
                template : "activation-mail.ejs",
                data 
            })
            return res.status(200).json({
                success : true,
                message : `Please check your email ${email} to activate your account`,
                activationToken : activationToken.token,
            })
        } catch (error:any) {
            return next(new ErrorHandler(error.message , 500));   
        } 
    } catch (error : any) {
        return next(new ErrorHandler(error.message , 500));
    }
    
})

interface IActivationToken {
    token: string
    activationCode: string
}

const createActivateToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign({ user, activationCode }, process.env.ACTIVATION_TOKEN_SECRET as Secret, { expiresIn: '5m' });
    return {
        token,
        activationCode
    }
}

// activate user
interface IActivationRequest{
    activate_token : string;
    activate_code : string;
}

export const ActivateUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {activate_token , activate_code} = req.body as IActivationRequest
        const newUser : {user : IUser , activationCode:string} = jwt.verify(activate_token , process.env.ACTIVATION_TOKEN_SECRET as Secret)
        if(activate_code !== newUser.activationCode){
            return next(new ErrorHandler("Invalid activation code", 400));
        }
        const {name,email,password} = newUser.user;
        const isAlreadyExist = await User.findOne({email})
        if(isAlreadyExist){
            return next(new ErrorHandler("Email already exists", 400));
        }
        const user = new User({name,email,password})
        await user.save();
        return res.status(200).json({
            success : true,
            message : "Account activated successfully",
            user : user.toObject()
        })
    } catch (error:any) {
       return next(new ErrorHandler(error.message , 500)); 
    }
})

// login user
interface ILoginUser{
    email : string
    password : string
}

export const Login = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email, password} = req.body as ILoginUser
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400))
        }
        const user = await User.findOne({email}).select('+password')
        if(!user){
            return next(new ErrorHandler("Invalid email or password", 401));
        }
        const isMatch = await user.comparePassword(password)
        if(!isMatch){
            return next(new ErrorHandler("Invalid email or password", 401));
        }  
        sendToken(user , 200 , res);
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// logout user

export const Logout = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        res.cookie("access_token" ,"" , {maxAge : 1})
        res.cookie("refresh_token" ,"" , {maxAge : 1})
        // delete from redis
        await redis.del(req.user?._id as string);
        res.status(200).json({
            success : true,
            message : "Logged out successfully"
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// update access token
export const updateAccessToken = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const refresh_token = req.cookies.refresh_token;
        if(!refresh_token){
            return next(new ErrorHandler("No refresh token provided", 401));
        }
        const decoded = jwt.verify(refresh_token , process.env.REFRESH_TOKEN_SECRET as Secret)
        if(!decoded){
            return next(new ErrorHandler("Invalid refresh token", 401));
        }
        // check if user exists in redis
        const cachedUser = await redis.get(decoded.id as string);
        if(!cachedUser){
            return next(new ErrorHandler("User not found , Please again login", 401));
        }
        // generate new access token
        const user = JSON.parse(cachedUser);
        const accessToken = jwt.sign({id: user?._id}, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' })
        const refreshToken = jwt.sign({id: user?._id}, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '7d' })
        req.user = user
        res.cookie("access_token" , accessToken , accessTokenOptions)
        res.cookie("refresh_token" , refreshToken , refreshTokenOptions)
        next();
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// get user information

export const getUserProfile = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const id = req.user?._id as string;
        if(!id){
            return next(new ErrorHandler("User not found", 404));
        }
        getUserById(id , res);
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

interface ISocialUser{
    name : string;
    email : string;
    avatar : string;
}
// social auth
export const socialAuth = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const { name , email , avatar } = req.body as ISocialUser;
       
        
        const user = await User.findOne({email})
        if(!user){
            const newUser = await User.create({ name , email , avatar })
            sendToken(newUser,200,res);
        }
        else{
            sendToken(user,200,res);
        }
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// update user profile
interface UserProfile{
    name : string;
}

export const updateUserProfile = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const {name} = req.body as UserProfile;
        const user = await User.findById(req.user?._id)
        if(name && user){
            user.name = name;
        }
        await user?.save();
        // update user from redis
        await redis.set(req.user?._id as string , JSON.stringify(user))

        return res.status(200).json({
            success : true,
            message : "User updated successfully",
            user : user?.toObject()
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// update user password
interface UserPasswordUpdate{
    oldPassword : string;
    newPassword : string;
}

export const updatePassword = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const {oldPassword,newPassword} = req.body as UserPasswordUpdate;
        const user = await User.findById(req.user?._id).select("+password")
        if(user?.password === undefined){
            return next(new ErrorHandler("User password not found", 400));
        }
        const isMatch = await user?.comparePassword(oldPassword)
        if(!isMatch){
            return next(new ErrorHandler("Invalid old password", 400));
        }
        user.password = newPassword;
        await user?.save();
        // update user from redis
        await redis.set(req.user?._id as string , JSON.stringify(user))

        return res.status(200).json({
            success : true,
            message : "Password changed successfully",
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// update avatar image
interface IAvatar {
    avatar : string;
}
export const updateAvatar = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const {avatar} = req.body as IAvatar;
        const user = await User.findById(req.user?._id);
        if(avatar && user){
            if (user?.avatar?.public_id) {
                await cloudinary.uploader.destroy(user?.avatar?.public_id)
                const myCloud = await cloudinary.uploader.upload(avatar , {
                    folder : "avatars",
                    width : 150
                })
                user.avatar = {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url
                }
            }
            else{
                const myCloud = await cloudinary.uploader.upload(avatar , {
                    folder : "avatars",
                })
                user.avatar = {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url
                } 
            }
        }
        await user?.save();  
        // update data from redis
        await redis.set(req.user?._id as string , JSON.stringify(user))
        res.status(200).json({
            success : true,
            message : "Avatar updated successfully",
            user : user?.toObject()
        })
    }  catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// get all users -> only for admin
export const getAllUsers = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const users = await User.find().sort({createdAt: -1})
        res.status(200).json({
            success : true,
            users
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// update user role -> only for admin

export const updateUserRole = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const {email, role} = req.body;
        const user = await User.findOne({email});
        if(user){
            user.role = role;
            await user?.save();
            // update data from redis
            await redis.set(user._id as string , JSON.stringify(user))
            res.status(200).json({
                success : true,
                message : "User role updated successfully",
                user : user?.toObject()
            })
        }
        else{
            return next(new ErrorHandler("User not found", 404));
        }
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// delete user -> only for admin
export const deleteUser = catchAsyncError(async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const {id} = req.params
       const user = await User.findById(id) 
       if (!user) {
        return next(new ErrorHandler("User not found",400))
       }
       await user.deleteOne({id});
       // delete from redis
       await redis.del(id)
       res.status(200).json({
        success: true,
        message: "User deleted successfully"
       })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    } 
})

