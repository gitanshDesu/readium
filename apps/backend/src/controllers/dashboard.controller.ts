import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

//Get an Entire User Profile (Total Likes, Total Followers, Total Blogs, Bookmarks, BlogHistory, Followers, Following, comments, replies, likes) [But make sure only user can access their entire profile(i.e. bookmarks,blogHistory as well)]

export const getUserProfile = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//using this end point we can get data to create user dashboard (for another user in this case)
export const getAnotherUserProfile = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { userId } = req.query;
    //1. check if userId sent is ValidObjectId or not
    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Object Id!"));
    }
    //2. Find if the user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json(new CustomError(404, "User Doesn't Exist!"));
    }
    //3. Get User details - firstName lastName username email avatar, Get User Blogs, Get User Total Followers, Total No. of People they're following

    //4. Return recent blogs (display blog in descending order (neweset first)) and popular(find by Views > Threshold && Likes > Threshold ) blogs (P.S we have to write some kind of algo to seggregate popular blogs from) by User
  }
);

//Get User Account Stats - Total Likes, Total Followers, Total Views on Blogs,Total Blogs
export const getUserAccountStats = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
