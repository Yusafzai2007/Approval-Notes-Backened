import dotenv from "dotenv";
import { app } from "./app.js";
import connectdb from "./db/index.js";
dotenv.config({
  path: "./.env",
});


connectdb()
  .then(() => {
    app.listen(process.env.PORT || 800, () => {
      console.log(`Server running ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Server making error ${err}`);
  });
