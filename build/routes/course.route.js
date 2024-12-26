"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("../controllers/course.controller");
const auth_1 = require("../middlewares/auth");
const user_controller_1 = require("../controllers/user.controller");
const courseRouter = express_1.default.Router();
// Create a new Course
courseRouter.post("/create-course", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), course_controller_1.uploadCourse);
// update Course
courseRouter.put("/update-course/:id", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), course_controller_1.editCourse);
// get single Course -> without purchasing
courseRouter.get("/get-single-course/:id", course_controller_1.getSingleCourse);
// get all courses -> without purchasing
courseRouter.get("/get-all-courses", course_controller_1.getAllCourses);
// get course content -> for valid user only
courseRouter.get("/get-course-content/:id", auth_1.isAuthenticated, course_controller_1.getCourseContent);
// add question
courseRouter.post("/add-question", auth_1.isAuthenticated, course_controller_1.addQuestion);
// add reply 
courseRouter.post("/add-reply", auth_1.isAuthenticated, course_controller_1.addAnswer);
// add review
courseRouter.post("/add-review/:id", auth_1.isAuthenticated, course_controller_1.addReview);
// add reply to review
courseRouter.post("/add-reply-review", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), course_controller_1.addReplyToReview);
// get all courses
courseRouter.get("/get-courses", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), course_controller_1.getCourses);
// delete course
courseRouter.delete("/delete-course/:id", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), course_controller_1.deleteCourse);
// generate video url
courseRouter.post("/generate-video", course_controller_1.generateVideoUrl);
exports.default = courseRouter;
