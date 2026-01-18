import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



// =======================
// PLACE ORDER : COD
// =======================
export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address } = req.body;

    if (!address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let amount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      amount += product.offerPrice * item.quantity;
    }

    // 2% tax
    amount += amount * 0.02;
    amount = Math.floor(amount * 100) / 100;

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
      isPaid: false
    });

    res.json({ success: true, message: "Order placed successfully" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};



// =======================
// PLACE ORDER : STRIPE
// =======================
export const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address } = req.body;
    const { origin } = req.headers;

    if (!address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let amount = 0;
    const line_items = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      amount += product.offerPrice * item.quantity;

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: product.name },
          unit_amount: Math.floor(product.offerPrice * 1.02 * 100),
        },
        quantity: item.quantity,
      });
    }

    amount += amount * 0.02;
    amount = Math.floor(amount * 100) / 100;

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
      isPaid: false
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId
      }
    });

    res.json({ success: true, url: session.url });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};



// =======================
// STRIPE WEBHOOK (IMPORTANT)
// =======================

// REQUIRED FOR VERCEL
export const config = {
  api: {
    bodyParser: false,
  },
};

export const stripeWebHooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ ONLY THIS EVENT
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { orderId, userId } = session.metadata;

    await Order.findByIdAndUpdate(orderId, { isPaid: true });
    await User.findByIdAndUpdate(userId, { cartItems: {} });
  }

  res.json({ received: true });
};



// =======================
// GET USER ORDERS
// =======================
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};



// =======================
// GET ALL ORDERS (ADMIN)
// =======================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
