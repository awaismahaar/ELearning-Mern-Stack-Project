"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getCourses = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseContent = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const nodeMailer_1 = __importDefault(require("../utils/nodeMailer"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const axios_1 = __importDefault(require("axios"));
require("dotenv").config();
// upload course
exports.uploadCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { data } = req.body;
        if (!data) {
            return next(new ErrorHandler_1.default("No course data provided", 400));
        }
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, course_service_1.createCourse)(data, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// edit course
exports.editCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { data } = req.body;
        const thumbnail = data.thumbnail;
        const courseData = await course_model_1.default.findById(req.params.id);
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary_1.default.uploader.destroy(thumbnail.public_id);
            const myCloud = await cloudinary_1.default.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        if (thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail.public_id,
                url: courseData?.thumbnail.url,
            };
        }
        const course = await course_model_1.default.findByIdAndUpdate(req.params.id, { $set: data }, { new: true });
        return res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get single course -> without purchase
exports.getSingleCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const isCacheExist = await redis_1.redis.get(req.params.id);
        if (isCacheExist) {
            return res.status(200).json({
                success: true,
                course: JSON.parse(isCacheExist),
            });
        }
        else {
            const course = await course_model_1.default.findById(req.params.id).select("-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestions");
            await redis_1.redis.set(req.params.id, JSON.stringify(course));
            return res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all courses -> without purchase
exports.getAllCourses = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const isCacheExist = await redis_1.redis.get("all-courses");
        if (isCacheExist) {
            return res.status(200).json({
                success: true,
                courses: JSON.parse(isCacheExist),
            });
        }
        else {
            const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestions");
            await redis_1.redis.set("all-courses", JSON.stringify(courses));
            return res.status(200).json({
                success: true,
                courses,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course content for valid user
exports.getCourseContent = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const userCoursesList = req.user?.courses;
        const courseId = req.params.id;
        const isCourseExist = userCoursesList?.find((c) => c._id.toString() === courseId);
        if (!isCourseExist) {
            return next(new ErrorHandler_1.default("Unauthorized access", 401));
        }
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData;
        return res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData?.find((c) => c._id.toString() === contentId);
        if (!content) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        content.questions.push(newQuestion);
        await course?.save();
        // create notification
        await notification_model_1.default.create({
            userId: req.user?._id,
            title: "New Question",
            message: `You have a new question in ${content.title}`,
        });
        return res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { questionId, courseId, contentId, answer } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData?.find((c) => c._id.toString() === contentId);
        const question = content?.questions.find((c) => c._id.toString() === questionId);
        if (!content) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        if (!question) {
            return next(new ErrorHandler_1.default("Invalid question id", 400));
        }
        const newAnswer = {
            user: req.user,
            answer,
        };
        question.questionReplies.push(newAnswer);
        await course?.save();
        if (req.user?._id === question.user._id) {
            // create a notification
            await notification_model_1.default.create({
                userId: req.user?._id,
                title: "New question reply received",
                message: `You have a new question reply in ${content.title}`,
            });
        }
        else {
            // send email
            const data = {
                name: question.user.name,
                title: content.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join("__dirname", "../mails/question-reply.ejs"), data);
            try {
                await (0, nodeMailer_1.default)({
                    email: question.user.email,
                    template: "question-reply.ejs",
                    subject: "Reply to question",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 500));
            }
        }
        return res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReview = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { comment, rating } = req.body;
        const userCoursesList = req.user?.courses;
        const courseId = req.params.id;
        const course = await course_model_1.default.findById(courseId);
        const isCourseExist = userCoursesList?.find((c) => c._id.toString() === courseId);
        if (!isCourseExist) {
            return next(new ErrorHandler_1.default("Unauthorized access", 401));
        }
        const review = {
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReplyToReview = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { comment, reviewId, courseId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const review = course?.reviews.find((r) => r._id.toString() === reviewId);
        if (!review) {
            return next(new ErrorHandler_1.default("Invalid review id", 400));
        }
        const reply = {
            user: req.user,
            comment,
        };
        review.repliesComment.push(reply);
        await course?.save();
        return res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all courses -> only for admin
exports.getCourses = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const courses = await course_model_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// delete course -> only for admin
exports.deleteCourse = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        await course_model_1.default.findByIdAndDelete(id);
        // delete from redis
        await redis_1.redis.del(id);
        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// generate video url
exports.generateVideoUrl = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        if (!videoId) {
            return next(new ErrorHandler_1.default("Video ID is required", 400));
        }
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
            },
        });
        if (!response.data || !response.data.otp || !response.data.playbackInfo) {
            return next(new ErrorHandler_1.default("Invalid response from Vdocipher API: Missing otp or playbackInfo", 500));
        }
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error("Vdocipher API Error:", error.response?.data || error.message);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
