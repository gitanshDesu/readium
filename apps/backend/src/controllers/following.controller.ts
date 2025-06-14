import { Following } from "@readium/database/following.model";
import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

// Follow and Unfollow a User
export const ToggleFollow = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { authorId } = req.params;
    if (!isValidObjectId(authorId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Author Id!"));
    }
    const existingUser = await User.findById(authorId);
    if (!existingUser) {
      return res.status(404).json(new CustomError(404, "User Doesn't Exist!"));
    }
    //Don't let user follow themselves
    if (existingUser._id.equals(new mongoose.Types.ObjectId(authorId))) {
      return res
        .status(400)
        .json(new CustomError(400, "User Can't Follow themselves!"));
    }
    // let a user follow an author. User(follower) --> following --> Author.
    const alreadyFollowingAuthor = await Following.findOne({
      $and: [{ following: authorId }, { follower: req.user?._id }],
    });
    if (!alreadyFollowingAuthor) {
      const followAuthor = await Following.create({
        following: authorId,
        follower: req.user?._id,
      });
      return res
        .status(200)
        .json(new CustomApiResponse(200, {}, "Author Followed Successfully!"));
    }
    const unfollowAuthor = await Following.findByIdAndDelete(
      alreadyFollowingAuthor._id
    );
    return res
      .status(200)
      .json(new CustomApiResponse(200, {}, "Author Unfollowed Successfully!"));
  }
);

// Get all the followers of a user
export const getAllFollowers = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //get all docs where following === req.user._id
    const allFollowers = await Following.find({
      following: req.user?._id,
    })
      .populate("follower", "username firstName lastName avatar email")
      .populate("following", "username firstName lastName avatar email");
    if (allFollowers.length === 0) {
      return res
        .status(404)
        .json(new CustomError(404, "User Has No Followers!"));
    }
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          allFollowers,
          "All User Followers Fetched Successfully!"
        )
      );
  }
);

//Get all the users a user is following
export const getFollowedUsers = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    // get all docs where follower === req.user?._id
    const allFollowedAuthors = await Following.find({
      follower: req.user?._id,
    })
      .populate("following", "username firstName lastName avatar email")
      .populate("follower", "username firstName lastName avatar email");
    if (allFollowedAuthors.length === 0) {
      return res
        .status(404)
        .json(new CustomError(404, "User Is Not Following Any Authors!"));
    }
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          allFollowedAuthors,
          "All Authors Followed By User Fetched Successfully!"
        )
      );
  }
);
