import { Blog } from "@readium/database/blog.model";
import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Response, Request } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import path from "node:path";
import { deleteFromS3, getUrlFromS3, uploadToS3 } from "@readium/utils/s3";
import {
  updateAccountDetailsInputSchema,
  UpdateAccountInputType,
} from "@readium/zod/updateAccountDetails";
interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const getAllUserBlogs = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //1. get all blogs where owner === user._id
    const allBlogs = await Blog.find({
      author: req.user?._id,
    }).populate("author", "username avatar firstName lastName"); //populate: Specifies paths which should be populated with other documents.
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
    const {
      newFirstName,
      newLastName,
      newUserName,
      oldUserName,
    }: UpdateAccountInputType = req.body;
    //1. Validate Input
    const validation = updateAccountDetailsInputSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json(new CustomError(400, validation.error.message));
    }
    //2. Make sure person sending request to update and person they are updating are same (compare req.user._id and user with oldUserName _id)

    const allowedUser = await User.findOne({ username: oldUserName }).select(
      "-password -bookmarks -blogHistory -googleId -provider -refreshToken -email"
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
    const existingUser = await User.findOne({ username: newUserName });
    if (existingUser) {
      //TODO: Create a util to generate unique usernames, to suggest user with unique username(s), after user's new username is not unique

      return res
        .status(400)
        .json(new CustomError(400, "User with this username already exists!"));
    }

    //4. set new firstName lastName username
    if (newUserName && newUserName.trim() !== "") {
      allowedUser.username = newUserName; //using allowedUser?.username and same for others cause ts(2779) error: The left-hand side of an assignment expression may not be an optional property access (resolved by using allowedUser!.username) or introducing that if(!allowedUser) to tell allowedUser is not null [We can't use ?. to tell TS allowedUser is not null because we are assigning allowedUser as optional and assigning values to it which we can't do this]
    }

    if (newLastName?.trim() !== "") {
      allowedUser.lastName = newLastName;
    }
    allowedUser.firstName = newFirstName;
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
    const avatarFileName = req.file?.filename;
    if (!avatarFileName) {
      throw new CustomError(400, "Avatar File is Missing!");
    }
    //2. Upload the avatar to cloudinary / S3
    const key = avatarFileName + path.extname(req.file?.originalname!);
    //2.1 Delete old image from S3
    const oldAvatarUrl = req.user?.avatar;
    const oldKey = oldAvatarUrl?.split("?")[0]?.split("/")[3]!;
    const response = await deleteFromS3(oldKey);
    if (!response) {
      throw new CustomError(500, "Error Occurred While Deleting Old Avatar!");
    }
    //2.2 Upload new avatar on S3 and get pre-signed URL
    const uploadResponse = await uploadToS3(
      key,
      req.file?.path!,
      req.file?.mimetype!
    );
    if (!uploadResponse) {
      throw new CustomError(500, "Error Occurred while uploading new Avatar!");
    }
    const newAvatarUrl = await getUrlFromS3(key);
    if (!newAvatarUrl) {
      throw new CustomError(500, "Error Occurred while getting Avatar URL!");
    }

    //TODO: Study about pre-signed S3 objects URLs or whatever is the right term. where we get already uploaded images on S3 link from client.

    //3. Update the avatar path in DB.
    req.user!.avatar = newAvatarUrl;
    req.user?.save({ validateModifiedOnly: true });
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          { newAvatarUrl },
          "Avatar Updated Successfully!"
        )
      );
  }
);

//user can delete only their account so no need of sending id from params
export const deleteUserAccount = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //1. Delete User avatar from S3

    const avatarUrl = req.user?.avatar;

    const key = avatarUrl?.split("?")[0]?.split("/")[3]!;
    const response = await deleteFromS3(key);
    if (!response) {
      throw new CustomError(500, "Error Occurred While Deleting Old Avatar!");
    }

    //2. Delete user (use findOneAndDelete method/query for this, because DELETE ON CASCADE we implemented on this query.)
    try {
      const deletedUser = await User.findOneAndDelete({
        _id: req.user?._id,
      }).select(
        "-password -bookmarks -blogHistory -email -refreshToken -googleId -provider"
      );
      //after deleting user clear out cookies and log him out
      const options = {
        httpOnly: true,
        secure: true,
      };

      return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
          new CustomApiResponse(200, deletedUser, "User Deleted Successfully!")
        );
    } catch (error) {
      throw new CustomError(
        500,
        `Error Occurred while Deleting User From DB:\n ${error}`
      );
    }
  }
);

export const getUserBookmarks = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    if (req.user?.bookmarks.length === 0) {
      return res
        .status(404)
        .json(new CustomError(404, "Bookmarks Doesn't Exist!"));
    }
    const bookmarks = req.user?.bookmarks.map(
      async (blogId) =>
        await Blog.findById(blogId)
          .populate(
            "author",
            "-password -bookmarks -blogHistory -refreshToken -googleId -provider -email"
          )
          .populate("tags", "-createdBy")
    );
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          { bookmarks },
          "User Bookmarks Fetched Successfully!"
        )
      );
  }
);

export const getUserBlogHistory = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const user = await User.aggregate([
      //1. filter out document where _id: req.user?._id
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      //2. left join the blog documents
      {
        $lookup: {
          from: "blogs",
          localField: "blogHistory",
          foreignField: "_id",
          as: "blogHistory",
          pipeline: [
            //perform $lookup on author
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author",
                pipeline: [
                  //Select and bring only these fields in author document.
                  {
                    $project: {
                      username: 1,
                      firstName: 1,
                      lastName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      //3. override author field with resultant author array field's(new field added by $lookup in pipeline) 0th element.
      {
        $addFields: {
          author: {
            $arrayElemAt: ["$author", 0],
          },
        },
      },
    ]);
    if (user.length === 0) {
      return res
        .status(404)
        .json(new CustomError(404, "Blog History Doesn't Exist!"));
    }
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          user[0].blogHistory,
          "Blog History Fetched Successfully!"
        )
      );
  }
);
