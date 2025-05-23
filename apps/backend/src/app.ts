import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CustomError } from "@readium/utils/customError";

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

//custom error handling middleware (all the next(err) will divert err to this middleware)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    // can't modify response, delegate to Express' default error handler
    return next(err);
  } else {
    res
      .status(500)
      .json(new CustomError(500, `${err} : Internal Server Error`));
  }
});

export { app };
