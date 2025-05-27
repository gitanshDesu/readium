import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

type MixedRequest = CustomRequest & Request;

export const isLoggedIn = tryCatchWrapper<MixedRequest>(
  async (req: MixedRequest, res: Response, next: NextFunction) => {
    try {
      //This logic makes sure that is there a session set up by passport (because we used oauth for signin)
      if (req.user && req.user?.provider === "google") {
        //if session is set - then next else proceed with normal verification logic
        return next();
      } else {
        const token =
          req.cookies?.accessToken ||
          req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
          throw new CustomError(401, "Unauthorized request!");
        }
        const decodedToken = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET
        ) as JwtPayload;
        const user = await User.findById(decodedToken?._id).select("-password");
        if (!user) {
          throw new CustomError(401, "Invalid Access Token");
        }
        req.user = user;
        next();
      }
    } catch (error) {
      throw new CustomError(
        401,
        `${error} : Error occurred while verifying if user is logged in or not!`
      );
    }
  }
);
