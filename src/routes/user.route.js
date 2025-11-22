import { Router } from "express";
import { currentuser, getstudent, loggedout, login, singupdata } from "../controllers/user.controller.js";
import { jwtverify } from "../middlewares/auth.middleware.js";

const route=Router()

route.post("/signup",singupdata)

route.post("/login",login)
route.post("/logout",jwtverify,loggedout)
route.get("/get-users",getstudent)
route.get("/currentuser",jwtverify,currentuser)
export default route;