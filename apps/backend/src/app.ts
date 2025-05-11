import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Express = express();

//cors
app.use(
  cors({
    origin: [process.env.CORS_FRONTEND_ORIGIN, process.env.CORS_WEB_ORIGIN],
    credentials: true,
  })
);

//express.json
app.use(express.json({ limit: "16kb" }));

//urlencoded
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//setting public folder
app.use(express.static("public"));

//cookie-parser
app.use(cookieParser());

export { app };
