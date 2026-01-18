import express from "express";
import {
  getAllOrders,
  getUserOrders,
  placeOrderCOD,
  placeOrderStripe,
  stripeWebHooks
} from "../controller/orderController.js";

import authUser from "../middlewares/authUser.js";
import authSeller from "../middlewares/authSeller.js";

const orderRouter = express.Router();

// USER ROUTES
orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.get("/user", authUser, getUserOrders);

// SELLER ROUTES
orderRouter.get("/seller", authSeller, getAllOrders);


export default orderRouter;