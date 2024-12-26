import express from 'express'
import { isAuthenticated, validateUserRole } from '../middlewares/auth';
import { coursesAnalytics, orderAnalytics, userAnalytics } from '../controllers/analytics.controller';
const analyticsRouter = express.Router();

// generate analytics for user
analyticsRouter.get("/analytics-users" , isAuthenticated , validateUserRole("admin") , userAnalytics);
// generate analytics for orders
analyticsRouter.get("/analytics-orders" , isAuthenticated , validateUserRole("admin") , orderAnalytics);
// generate analytics for courses
analyticsRouter.get("/analytics-courses" , isAuthenticated , validateUserRole("admin") , coursesAnalytics);
export default analyticsRouter;