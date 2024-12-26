import express from 'express'
import { isAuthenticated, validateUserRole } from '../middlewares/auth';
import { createOrder, createPayment, getAllOrders, sendStripePublishableKey } from '../controllers/order.controller';
const orderRouter = express.Router();

// create order
orderRouter.post("/create-order" , isAuthenticated , createOrder);
// get all orders
orderRouter.get("/get-orders", isAuthenticated , validateUserRole("admin"), getAllOrders)
// get stripe publishable key
orderRouter.get("/payment/stripe-key" , sendStripePublishableKey)
// new payment
orderRouter.post("/payment" , isAuthenticated , createPayment)
export default orderRouter;