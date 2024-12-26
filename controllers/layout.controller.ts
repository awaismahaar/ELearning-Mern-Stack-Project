import { NextFunction, Request } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import Layout from "../models/layout.model";
import cloudinary from "../utils/cloudinary";

// create layout
export const createLayout = catchAsyncError(async (req:Request,res:Response , next:NextFunction)=>{
    try {
        const {type} = req.body; 
        const layout = await Layout.findOne({type});
        if(layout){
            return next(new ErrorHandler(`${type} already exists`, 400));
        }
        if(type === "Banner"){
            const {title,description,image} = req.body;
            if(!title ||!description ||!image){
                return next(new ErrorHandler("All fields are required for Banner layout", 400));
            }
            const myCloud = await cloudinary.uploader.upload(image,{
                folder : "layout"
            })
            const banner = {
                image : {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url
                },
                title,
                description
            }
            await Layout.create({ type : type , banner})
        }
        if(type === "FAQ"){
            const {faq} = req.body;
            if(!faq){
                return next(new ErrorHandler("All fields are required for FAQ layout", 400));
            }
            await Layout.create({
                type : type,
                faq 
            })
        }
        if(type === "Categories"){
            const {categories} = req.body;
            if(!categories){
                return next(new ErrorHandler("Name required for Categories layout", 400));
            }
            await Layout.create({
                type : type,
                categories,
            })
        }
        return res.status(200).json({
            success : true,
            message : "Layout created successfully"
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// edit layout
export const editLayout = catchAsyncError(async (req:Request,res:Response , next:NextFunction)=>{
    try {
        const {type} = req.body; 
        const bannerLayout = await Layout.findOne({type : "Banner"});
        if(type === "Banner"){
            const {title,description,image} = req.body;
            await cloudinary.uploader.destroy(bannerLayout?.banner.image.public_id)
            const myCloud = await cloudinary.uploader.upload(image,{
                folder : "layout"
            })
            const banner = {
                image : {
                    public_id : myCloud.public_id,
                    url : myCloud.secure_url
                },
                title,
                description
            }
            await Layout.findByIdAndUpdate(bannerLayout?._id , {type : "Banner" , banner})
        }
        if(type === "FAQ"){

            const {faq} = req.body;
            const faqLayout = await Layout.findOne({type : "FAQ"});
            await Layout.findByIdAndUpdate(faqLayout?._id , {type : "FAQ" , faq})
        }
        if(type === "Categories"){
            const {categories} = req.body;
            const categoryLayout = await Layout.findOne({type : "Categories"});
            await Layout.findByIdAndUpdate(categoryLayout?._id , {type : "Categories" , categories})
        }
        return res.status(200).json({
            success : true,
            message : "Layout updated successfully"
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})

// get layout by type

export const getLayoutByType = catchAsyncError(async (req:Request,res:Response , next:NextFunction)=>{
    try {
        const {type} = req.params;
        const layout = await Layout.findOne({type});
        if(!layout){
            return next(new ErrorHandler(`${type} layout not found`, 404));
        }
        return res.status(200).json({
            success : true,
            layout
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message , 500));
    }
})