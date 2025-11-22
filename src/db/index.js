import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectdb = async () => {
  try {
    const connect = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log("Database connected successfully", connect.connection.host);
  } catch (error) {
    console.log(`Mongodb connection error ${error}`);
  }
};

export default connectdb;
