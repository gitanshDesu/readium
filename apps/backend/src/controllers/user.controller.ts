import { Blog } from "@readium/database/blog.model";
import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Response, Request } from "express";
import { isValidObjectId } from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const getAllUserBlogs = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //1. get all blogs where owner === user._id
    const allBlogs = await Blog.find({
      author: req.user?._id,
    }).populate("author", "username email avatar firstName lastName"); //populate: Specifies paths which should be populated with other documents.
    if (allBlogs.length === 0) {
      return res
        .status(404)
        .json(new CustomError(404, "User Doesn't Have Any Blogs"));
    }
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          allBlogs,
          "All User Blog Fetched Successfully!"
        )
      );
  }
);

export const updateAccountDetails = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { NewFirstName, NewLastName, NewUsername, OldUsername } = req.body;
    OldUsername;
    //1. Validate Input

    //2. Make sure person sending request to update and person they are updating are same (compare req.user._id and user with OldUsername _id)

    const allowedUser = await User.findOne({ username: OldUsername }).select(
      "-password -bookmarks -blogHistory -googleId -provider -refreshToken"
    );

    //This is also important for telling TS that allowedUser is not null
    if (!allowedUser) {
      return res.status(404).json(new CustomError(404, "No Such User Exists!"));
    }

    if (!req.user?._id.equals(allowedUser?._id)) {
      return res
        .status(401)
        .json(new CustomError(401, "Unauthorized To Update Username"));
    }

    //3. Check if new username provided by User is not already taken by some other user. If yes provide  unique username options
    const existingUser = await User.findOne({ username: NewUsername });
    if (existingUser) {
      //TODO: Create a util to generate unique usernames, to suggest user with unique username(s), after user's new username is not unique

      return res
        .status(400)
        .json(new CustomError(400, "User with this username already exists!"));
    }

    //4. set new firstName lastName username
    allowedUser.username = NewUsername; //using allowedUser?.username and same for others cause ts(2779) error: The left-hand side of an assignment expression may not be an optional property access (resolved by using allowedUser!.username) or introducing that if(!allowedUser) to tell allowedUser is not null [We can't use ?. to tell TS allowedUser is not null because we are assigning allowedUser as optional and assigning values to it which we can't do this]
    allowedUser.firstName = NewFirstName;
    allowedUser.lastName = NewLastName;
    await allowedUser.save({ validateModifiedOnly: true });
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          allowedUser,
          "Account Details Updated Successfully!"
        )
      );
  }
);

export const updateAvatar = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //1. Get new Avatar link from req.file (comes from multer)
    //2. Upload the avatar to cloudinary / S3
    //TODO: Study about pre-signed S3 objects or whatever is the right term. where we get already uploaded images on S3 link from client.
    //3. Update the avatar path in DB.
  }
);

export const deleteUserAccount = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //1. Get userId from req.params
    const { id } = req.params;
    //2. Check if the id sent is valid object id
    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Object Id!"));
    }
    //3. Check if user exists with this id or not
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json(new CustomError(404, "User Doesn't Exist!"));
    }
    //4. Delete user (use findOneAndDelete method/query for this, because DELETE ON CASCADE we implemented on this query.)
    const deletedUser = await User.findOneAndDelete({
      _id: existingUser._id,
    }).select(
      "-password -bookmarks -blogHistory -email -refreshToken -googleId -provider"
    );
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, deletedUser, "User Deleted Successfully!")
      );
  }
);

export const getUserBookmarks = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

export const getUserBlogHistory = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
