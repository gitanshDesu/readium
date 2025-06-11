import { Blog } from "@readium/database/blog.model";
import { Following } from "@readium/database/following.model";
import { Like } from "@readium/database/like.model";
import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

//using this end points we can get stats required to display on user's dashboard

//Get an Entire User Profile Stats (Total Likes, Total Followers, Total Blogs, Total Bookmarks, BlogHistory, Total Followers, Total Followin, Total Muted Users Total Muted Topics)

export const getUserProfileStats = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const userDetails = {
      username: req.user?.username,
      firstName: req.user?.firstName,
      lastName: req.user?.lastName,
      avatar: req.user?.avatar,
    };
    const TotalFollowers = await Following.countDocuments({
      following: { $eq: req.user?._id },
    });
    const TotalAuthorsFollowed = await Following.countDocuments({
      follower: { $eq: req.user?._id },
    });
    const TotalBookmarks = req.user?.bookmarks.length;
    const TotalBlogs = await Blog.countDocuments({
      author: { $eq: req.user?._id },
    });
    //calculate total likes on blogs
    const TotalBlogLikes = await Like.countDocuments({
      blog: { $in: await Blog.find({ author: req.user?._id }).distinct("_id") },
    });
    //TODO: Add totalBlogViews, TotalMutedUsers and TotalMutedTopics later.
    return res.status(200).json(
      new CustomApiResponse(
        200,
        {
          userDetails,
          TotalFollowers,
          TotalAuthorsFollowed,
          TotalBookmarks,
          TotalBlogs,
          TotalBlogLikes,
        },
        "User Profile Fetched Successfully!"
      )
    );
  }
);

//using this end point we can get stats to create user dashboard (for another user in this case)
export const getAnotherUserProfileStats = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { userId } = req.params;
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
    const userDetails = {
      username: existingUser?.username,
      firstName: existingUser?.firstName,
      lastName: existingUser?.lastName,
      avatar: existingUser?.avatar,
    };
    const TotalFollowers = await Following.countDocuments({
      following: { $eq: existingUser?._id },
    });
    const TotalAuthorsFollowed = await Following.countDocuments({
      follower: { $eq: existingUser?._id },
    });
    const TotalBookmarks = existingUser?.bookmarks.length;
    const TotalBlogs = await Blog.countDocuments({
      author: { $eq: existingUser?._id },
    });
    //calculate total likes on blogs
    const TotalBlogLikes = await Like.countDocuments({
      blog: {
        $in: await Blog.find({ author: existingUser?._id }).distinct("_id"),
      },
    });
    //TODO: Add totalBlogViews later.
    return res.status(200).json(
      new CustomApiResponse(
        200,
        {
          userDetails,
          TotalFollowers,
          TotalAuthorsFollowed,
          TotalBookmarks,
          TotalBlogs,
          TotalBlogLikes,
        },
        "User Profile Fetched Successfully!"
      )
    );

    //4. Return recent blogs (display blog in descending order (neweset first)) and popular(find by Views > Threshold && Likes > Threshold ) blogs (P.S we have to write some kind of algo to seggregate popular blogs from) by User
  }
);
