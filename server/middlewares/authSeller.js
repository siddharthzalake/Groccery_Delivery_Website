import jwt from "jsonwebtoken";

const authSeller = async (req, res, next) => {
  try {
    const { sellerToken } = req.cookies;

    if (!sellerToken) {
      return res.json({
        success: false,
        message: "Not Authorized"
      });
    }

    const tokenDecode = jwt.verify(
      sellerToken,
      process.env.JWT_SECRET
    );

    if (tokenDecode.email !== process.env.SELLER_EMAIL) {
      return res.json({
        success: false,
        message: "Not Authorized"
      });
    }

    return next(); // ✅ VERY IMPORTANT

  } catch (error) {
    return res.json({
      success: false,
      message: error.message
    });
  }
};

export default authSeller;
