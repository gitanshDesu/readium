import { Blog } from "@readium/database/blog.model";
import { Comment } from "@readium/database/comment.model";
import { UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const createComment = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId, content } = req.body;
    if (content?.trim() === "") {
      return res
        .status(400)
        .json(new CustomError(400, "Content field is required!"));
    }
    if (!isValidObjectId(blogId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Blog Id!"));
    }
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) {
      return res.status(404).json(new CustomError(400, "Blog Doesn't Exist!"));
    }
    const newComment = await Comment.create({
      content,
      blog: blogId,
      commentedBy: req.user?._id,
    });
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, newComment, "Comment Created Successfully!")
      );
  }
);

//Get all the comments under a blog (using blog id)
export const getAllComments = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.body;
    if (!isValidObjectId(blogId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Blog Id!"));
    }
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) {
      return res.status(404).json(new CustomError(404, "Blog Doesn't Exist!"));
    }
    const allComments = await Comment.aggregate([
      {
        $match: {
          blog: new mongoose.Types.ObjectId(blogId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commentedBy",
          foreignField: "_id",
          as: "commentedBy",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          commentedBy: {
            $first: "$commentedBy",
          },
        },
      },
    ]);
    //TODO: Add paginate logic
    console.log("allComments Array: \n", allComments);
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, {}, "All Comments Fetched Successfully!")
      );
  }
);

//Update a comment using comment id (only comment owner can update a comment)
export const editComment = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Comment Id!"));
    }

    if (content?.trim() === "") {
      return res
        .status(400)
        .json(new CustomError(400, "content field is required!"));
    }

    const existingComment = await Comment.findOne({
      $and: [{ _id: commentId }, { commentedBy: req.user?._id }],
    })
      .select("-blog")
      .populate("commentedBy", "username firstName lastName avatar");

    if (!existingComment) {
      return res
        .status(404)
        .json(new CustomError(404, "Comment Doesn't Exist!"));
    }

    existingComment.content = content;
    await existingComment.save({ validateModifiedOnly: true });
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          existingComment,
          "Comment Updated Successfully!"
        )
      );
  }
);

//Delete a comment using comment id (only comment owner can delete a comment)
export const deleteComment = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Comment Id!"));
    }
    const existingComment = await Comment.findOne({
      $and: [{ _id: commentId }, { commentedBy: req.user?._id }],
    })
      .select("-blog")
      .populate("commentedBy", "username firstName lastName avatar");
    if (!existingComment) {
      return res
        .status(404)
        .json(new CustomError(404, "Comment Doesn't Exist!"));
    }
    await Comment.findOneAndDelete({ _id: existingComment._id });
    return res
      .status(200)
      .json(new CustomApiResponse(200, {}, "Commented Deleted Successfully!"));
  }
);
