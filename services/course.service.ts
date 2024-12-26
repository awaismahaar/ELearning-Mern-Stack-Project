import { Response } from "express";
import Course from "../models/course.model";

// create course
export const createCourse = async (data:any , res:Response)=>{
    const course = await Course.create(data);
    res.status(201).json({
        success : true,
        message : "Course created successfully",
    });
}