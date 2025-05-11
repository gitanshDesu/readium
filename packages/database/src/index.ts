import mongoose from "mongoose";

import dotenv from "dotenv";
import path from "path";

console.log("Inside connectDB function: \n");

//to load env vars from .env file in this index.ts we have to use dotenv here as well w/o this clg'ing `process.env.MONGODB_URI` o/p's undefined & after using dotenv clg'ing o/p's expected string value.

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

console.log(path.resolve(process.cwd(), ".env.local"));
console.log(process.env.MONGODB_URI);

const connectDB = async () => {
  try {
    const connnectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connnectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
