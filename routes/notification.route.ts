import express from 'express';
import { isAuthenticated, validateUserRole } from '../middlewares/auth';
import { getAllNotifications, updateNotification } from '../controllers/notification.controller';
const notificationRouter = express.Router();

// get all notifications
notificationRouter.get("/get-notifications" , isAuthenticated , validateUserRole("admin") , getAllNotifications);
// update notification status
notificationRouter.get("/update-notification/:id" , isAuthenticated , validateUserRole("admin") , updateNotification);
export default notificationRouter;