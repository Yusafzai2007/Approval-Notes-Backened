import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
import { apiErrror } from "./utils/apiError.js";
app.use(
  cors({
    origin: process.env.Cors_ORIGN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());





import userRoute from "./routes/user.route.js"

app.use("/api/v1",userRoute)







import classRoute from "./routes/class.route.js"

app.use("/api/v1",classRoute)






// ✅ Custom Error Handling Middleware (must be at the END)
app.use((err, req, res, next) => {
  if (err instanceof apiErrror) {
    return res.status(err.statuscode).json({
      success: false,
      message: err.message,
      error: err.error || [],
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export { app };
