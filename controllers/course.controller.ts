import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "../utils/cloudinary";
import { createCourse } from "../services/course.service";
import Course from "../models/course.model";
import { redis } from "../utils/redis";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/nodeMailer";
import Notification from "../models/notification.model";
import axios from "axios";
require("dotenv").config();
// upload course
export const uploadCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      if (!data) {
        return next(new ErrorHandler("No course data provided", 400));
      }
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit course
export const editCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      const thumbnail = data.thumbnail;
      const courseData = await Course.findById(req.params.id);
      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudinary.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      if(thumbnail.startsWith("https")){
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        };
      }
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { $set: data },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: "Course updated successfully",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course -> without purchase
export const getSingleCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get(req.params.id);
      if (isCacheExist) {
        return res.status(200).json({
          success: true,
          course: JSON.parse(isCacheExist),
        });
      } else {
        const course = await Course.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestions"
        );
        await redis.set(req.params.id, JSON.stringify(course));
        return res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses -> without purchase
export const getAllCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("all-courses");
      if (isCacheExist) {
        return res.status(200).json({
          success: true,
          courses: JSON.parse(isCacheExist),
        });
      } else {
        const courses = await Course.find().select(
          "-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestions"
        );
        await redis.set("all-courses", JSON.stringify(courses));
        return res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course content for valid user
export const getCourseContent = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCoursesList = req.user?.courses;
      const courseId = req.params.id;
      const isCourseExist = userCoursesList?.find(
        (c) => c._id.toString() === courseId
      );
      if (!isCourseExist) {
        return next(new ErrorHandler("Unauthorized access", 401));
      }
      const course = await Course.findById(courseId);
      const content = course?.courseData;
      return res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add Question

interface IAddQuestion {
  question: string;
  courseId: string;
  contentId: string;
}
export const addQuestion = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body as IAddQuestion;
      const course = await Course.findById(courseId);
      const content = course?.courseData?.find(
        (c) => c._id.toString() === contentId
      );
      if (!content) {
        return next(new ErrorHandler("Invalid content id", 400));
      }
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      content.questions.push(newQuestion);
      await course?.save();

      // create notification
      await Notification.create({
        userId: req.user?._id,
        title: "New Question",
        message: `You have a new question in ${content.title}`,
      });
      return res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add Question

interface IAddAnswer {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
export const addAnswer = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { questionId, courseId, contentId, answer } =
        req.body as IAddAnswer;
      const course = await Course.findById(courseId);
      const content = course?.courseData?.find(
        (c) => c._id.toString() === contentId
      );
      const question = content?.questions.find(
        (c) => c._id.toString() === questionId
      );
      if (!content) {
        return next(new ErrorHandler("Invalid content id", 400));
      }
      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }
      const newAnswer: any = {
        user: req.user,
        answer,
      };
      question.questionReplies.push(newAnswer);
      await course?.save();
      if (req.user?._id === question.user._id) {
        // create a notification
        await Notification.create({
          userId: req.user?._id,
          title: "New question reply received",
          message: `You have a new question reply in ${content.title}`,
        });
      } else {
        // send email
        const data = {
          name: question.user.name,
          title: content.title,
        };
        const html = await ejs.renderFile(
          path.join("__dirname", "../mails/question-reply.ejs"),
          data
        );
        try {
          await sendEmail({
            email: question.user.email,
            template: "question-reply.ejs",
            subject: "Reply to question",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }
      return res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add review in course
interface IAddReview {
  comment: string;
  rating: number;
}

export const addReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, rating } = req.body as IAddReview;
      const userCoursesList = req.user?.courses;
      const courseId = req.params.id;
      const course = await Course.findById(courseId);
      const isCourseExist = userCoursesList?.find(
        (c) => c._id.toString() === courseId
      );
      if (!isCourseExist) {
        return next(new ErrorHandler("Unauthorized access", 401));
      }
      const review: any = {
        user: req.user,
        comment,
        rating,
      };
      course?.reviews.push(review);
      const avgRating = course?.reviews.length
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) /
          course.reviews.length
        : 0;
      if (course) {
        course.rating = avgRating;
      }
      await course?.save();

      // create notification
      const notification = {
        title: "New Review Added",
        message: `${req.user?.name} has added review in ${course?.name}`,
      };
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply to review
interface IAddReplyToReview {
  comment: string;
  reviewId: string;
  courseId: string;
}
export const addReplyToReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, reviewId, courseId } = req.body as IAddReplyToReview;
      const course = await Course.findById(courseId);
      const review = course?.reviews.find((r) => r._id.toString() === reviewId);
      if (!review) {
        return next(new ErrorHandler("Invalid review id", 400));
      }
      const reply: any = {
        user: req.user,
        comment,
      };
      review.repliesComment.push(reply);
      await course?.save();
      return res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses -> only for admin
export const getCourses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await Course.find().sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// delete course -> only for admin
export const deleteCourse = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {id} = req.params;
      await Course.findByIdAndDelete(id);
      // delete from redis
      await redis.del(id);
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// generate video url
export const generateVideoUrl = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { videoId } = req.body;
  
        if (!videoId) {
          return next(new ErrorHandler("Video ID is required", 400));
        }
  
        const response = await axios.post(
          `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
          { ttl: 300 },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
            },
          }
        );
  
        if (!response.data || !response.data.otp || !response.data.playbackInfo) {
          return next(
            new ErrorHandler(
              "Invalid response from Vdocipher API: Missing otp or playbackInfo",
              500
            )
          );
        }
  
        res.status(200).json(response.data);
      } catch (error: any) {
        console.error("Vdocipher API Error:", error.response?.data || error.message);
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );
