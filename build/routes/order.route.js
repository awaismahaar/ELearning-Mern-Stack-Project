"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const order_controller_1 = require("../controllers/order.controller");
const orderRouter = express_1.default.Router();
// create order
orderRouter.post("/create-order", auth_1.isAuthenticated, order_controller_1.createOrder);
// get all orders
orderRouter.get("/get-orders", auth_1.isAuthenticated, (0, auth_1.validateUserRole)("admin"), order_controller_1.getAllOrders);
// get stripe publishable key
orderRouter.get("/payment/stripe-key", order_controller_1.sendStripePublishableKey);
// new payment
orderRouter.post("/payment", auth_1.isAuthenticated, order_controller_1.createPayment);
exports.default = orderRouter;
