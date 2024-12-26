import express from 'express'
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, generateVideoUrl, getAllCourses, getCourseContent, getCourses, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { isAuthenticated, validateUserRole } from '../middlewares/auth';
import { updateAccessToken } from '../controllers/user.controller';
const courseRouter = express.Router();

// Create a new Course
courseRouter.post("/create-course" , updateAccessToken , isAuthenticated , validateUserRole("admin") , uploadCourse);
// update Course
courseRouter.put("/update-course/:id" , isAuthenticated , validateUserRole("admin") , editCourse);
// get single Course -> without purchasing
courseRouter.get("/get-single-course/:id" , getSingleCourse);
// get all courses -> without purchasing
courseRouter.get("/get-all-courses" ,  getAllCourses)
// get course content -> for valid user only
courseRouter.get("/get-course-content/:id" , isAuthenticated , getCourseContent);
// add question
courseRouter.post("/add-question" , isAuthenticated , addQuestion);
// add reply 
courseRouter.post("/add-reply" , isAuthenticated , addAnswer);
// add review
courseRouter.post("/add-review/:id" , isAuthenticated , addReview)
// add reply to review
courseRouter.post("/add-reply-review" , isAuthenticated , validateUserRole("admin"), addReplyToReview);
// get all courses
courseRouter.get("/get-courses" , isAuthenticated , validateUserRole("admin"), getCourses);
// delete course
courseRouter.delete("/delete-course/:id" , isAuthenticated , validateUserRole("admin"), deleteCourse);
// generate video url
courseRouter.post("/generate-video" , generateVideoUrl)

export default courseRouter;