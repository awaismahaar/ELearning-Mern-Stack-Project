"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const notificationRouter = express_1.default.Router();
// get all notifications
notificationRouter.get("/get-notifications", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), notification_controller_1.getAllNotifications);
// update notification status
notificationRouter.get("/update-notification/:id", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), notification_controller_1.updateNotification);
exports.default = notificationRouter;
