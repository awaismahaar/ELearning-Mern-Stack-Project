"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const analytics_controller_1 = require("../controllers/analytics.controller");
const analyticsRouter = express_1.default.Router();
// generate analytics for user
analyticsRouter.get("/analytics-users", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), analytics_controller_1.userAnalytics);
// generate analytics for orders
analyticsRouter.get("/analytics-orders", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), analytics_controller_1.orderAnalytics);
// generate analytics for courses
analyticsRouter.get("/analytics-courses", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), analytics_controller_1.coursesAnalytics);
exports.default = analyticsRouter;
