import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions{
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    secure?: boolean;
    sameSite : 'lax' | 'strict' | 'none' | undefined;
}

const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '5');
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '7');
export const accessTokenOptions : ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
}
export const refreshTokenOptions : ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
}
export const sendToken = (user : IUser,statusCode : number,res:Response)=>{
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();


    if(process.env.NODE_ENV === 'production'){
        accessTokenOptions.secure = true;
    }
    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);
    // session store in redis
    redis.set(user._id , JSON.stringify(user) as any);

    res.status(statusCode).json({
        success: true,
        message: 'Login successful',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isVerified: user.isVerified,
            role: user.role
        },
        accessToken
    })
}