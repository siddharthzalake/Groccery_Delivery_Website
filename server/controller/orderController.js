import Order from "../models/Order.js" 
import Product from "../models/Product.js"
import User from "../models/User.js"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// place order COD : /api/order/cod

export const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, address } = req.body;

        if (!address || !items || items.length === 0) {
            return res.json({
                success: false,
                message: "Invalid Data"
            });
        }

        let amount = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);
            amount += product.offerPrice * item.quantity;
        }

        // Add 2% tax
        amount += amount * 0.02;
        amount = Math.floor(amount * 100) / 100;

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD"
        });

        return res.json({
            success: true,
            message: "Order Placed Successfully"
        });

    } catch (error) {
        console.log(error.message);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

export const placeOrderStripe = async (req, res) => {
    try {
        const userId = req.user.id;   // ✅ FIXED
        const { address, items } = req.body;
        const { origin } = req.headers;

        if (!Array.isArray(items) || items.length === 0 || !address) {
            return res.json({ success: false, message: "Invalid Data" });
        }

        let amount = 0;
        let productData = [];

        for (const item of items) {
            const product = await Product.findById(item.product);

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity
            });

            amount += product.offerPrice * item.quantity;
        }

        // Add 2% tax
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

        const line_items = productData.map(item => ({
            price_data: {
                currency: "usd",
                product_data: { name: item.name },
                unit_amount: Math.floor(item.price * 1.02 * 100)
            },
            quantity: item.quantity
        }));

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            payment_intent_data: {
                metadata: {
                    orderId: order._id.toString(),
                    userId
                }
            }
        });

        return res.json({ success: true, url: session.url });

    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};



// stripe WEbHooks to verify payments actiopn : /stripe

export const stripeWebHooks = async (req,res)=>{
    // stripe Gateway Initalize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        res.status(400).send(`Webhook Error: ${error.message}`)
    }

    // Handle the event

   switch (event.type) {
    case "payment_intent.succeeded":{

        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        // Getting Session Metadata

        const session = await stripeInstance.checkout.sessions.list({
            payment_intent:paymentIntentId,
        })

        const {orderId,userId} = session.data[0].metadata;

        //Mark Payment as Paid 

        await Order.findByIdAndUpdate(orderId,{isPaid:true})

        //clear Cart Data

        await User.findByIdAndUpdate(userId,{cartItems : {}});
        break;
    }

    case "payment_intent.payment_failed":{
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        // Getting Session Metadata

        const session = await stripeInstance.checkout.sessions.list({
            payment_intent:paymentIntentId,
        })

        const {orderId} = session.data[0].metadata;

        await Order.findByIdAndDelete(orderId)       
        break;
    }

    default:
        console.error(`unhandled event type ${event.type}`)
        break;
   }

   res.json({recieved : true})
}



export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        })
        .populate("items.product address")
        .sort({ createdAt: -1 });

        return res.json({
            success: true,
            orders
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }
};


//Get All Orders (for seller or admin) : /api/order/seller 
 export const getAllOrders=async (req,res)=>{ 
    try {
        const orders=await Order.find({
         $or : [{paymentType:"COD"},{isPaid:true}] }).populate("items.product address").sort({createdAt:-1});
         return res.json({success:true,orders})

        } catch (error) {
             res.json({sucess:false,message:error.message})
        }
    }


