import User from "../models/User.js";

// Update User CartData : /api/cart/update
export const updateCart = async (req, res) => {
    try {
        const { cartItems } = req.body;
        const userId = req.user.id;   // ✅ FIX HERE

        if (!cartItems) {
            return res.json({
                success: false,
                message: "cartItems is missing"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { cartItems: cartItems } },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Cart Updated Successfully"
        });

    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
};
