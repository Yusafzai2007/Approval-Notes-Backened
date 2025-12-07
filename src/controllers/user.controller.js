import { asynhandler } from "../utils/asynchandler.js";
import { apiErrror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { signup } from "../models/user.model.js";

const generatetoken = async (userId) => {
  try {
    const user = await signup.findById(userId);
    const isaccesstoken = await user.isaccesstoken();
    return { isaccesstoken };
  } catch (error) {
    throw new apiErrror(`token generating problem ${error}`);
  }
};

const singupdata = asynhandler(async (req, res) => {
  const { userName, email, password,role } = req.body;

  if (!userName || !email || !password || !role) {
    throw new apiErrror(400, "singup filed is requireds");
  }

  const existemail = await signup.findOne({ email });

  if (existemail) {
    throw new apiErrror(409, "email is already exist");
  }

  const user = await signup.create({
    userName,
    email,
    password,
    role,
  });

  const loggedinyser = await signup
    .findById(user._id)
    .select("-password -updatedAt -createdAt");

  if (!loggedinyser) {
    throw new apiErrror(500, "server error ");
  }

  res
    .status(200)
    .json(new apiResponse(200, loggedinyser, "user create successfully"));
});

const login = asynhandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiErrror(404, "all filed are required");
  }

  const existlogin = await signup.findOne({ email });

  if (!existlogin) {
    throw new apiErrror(404, "user not exist");
  }

  const checkpassword = await existlogin.ispasswordCorrect(password);

  if (!checkpassword) {
    throw new apiErrror(410, "password wrong");
  }

  const { isaccesstoken } = await generatetoken(existlogin._id);
  console.log("isaccesstoken", isaccesstoken);

  const loginuser = await signup.findById(existlogin._id).select("-password");

  const option = {
    httpOnly: true,
    secure: false,
  };

  res
    .status(200)
    .cookie("isaccesstoken", isaccesstoken, option)
    .json(new apiResponse(200, loginuser, "user login successfully"));
});

const loggedout = asynhandler(async (req, res) => {
  await signup.findByIdAndUpdate(req.user._id);

  const option = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("isaccesstoken", option)
    .clearCookie("isrefreshtoken", option)
    .json(new apiResponse(200, {}, "loggedout successfully"));
});

const getstudent = asynhandler(async (req, res) => {
  const user = await signup.find().select("-password");
  if (user.length === 0) {
    throw new apiErrror(404, "users data is empty");
  }

  res
    .status(200)
    .json(new apiResponse(200, "user data fetch successfully", user));
});

const currentuser = asynhandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new apiErrror(400, "No user data found");
  }

  const userdata = await signup.findOne({ _id: user._id });

  res.status(200).json(new apiResponse(200, "currentuser", userdata));
});

const logoutuser = asynhandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id);

  const options = {
    httpOnly: true,
    secure: false,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, null, "Logout successful"));
});

export { singupdata, login, loggedout, getstudent, currentuser, logoutuser };
