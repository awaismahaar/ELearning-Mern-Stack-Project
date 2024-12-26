import { Response } from "express";
import User from "../models/user.model"
import { redis } from "../utils/redis";

export const getUserById = async (id : string , res:Response)=>{
    // fetch user from redis
    const user = await redis.get(id);
    if(user){
        return res.status(200).json({
            success : true,
            user
        })
    }
    
}