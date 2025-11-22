import { asynhandler } from "../utils/asynchandler.js";
import { apiErrror } from "../utils/apiError.js";
import { signup } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const jwtverify = asynhandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.isaccesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request, token missing",
        error: [],
        data: null,
      });
    }

    const decodetoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await signup.findById(decodetoken?._id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        error: [],
        data: null,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error?.message || "Invalid access token",
      error: [],
      data: null,
    });
  }
});

export { jwtverify };
