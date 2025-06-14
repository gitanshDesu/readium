import { UserDocumentType } from "@readium/database/user.model";
import { Like } from "@readium/database/like.model";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { exec } from "child_process";
import { Comment } from "@readium/database/comment.model";
import { Blog } from "@readium/database/blog.model";
import { Reply } from "@readium/database/reply.model";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

//toggle blog like
export const toggleBlogLike = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.params;
    if (!isValidObjectId(blogId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Blog Id!"));
    }
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) {
      return res.status(404).json(new CustomError(404, "Blog Doesn't Exist!"));
    }
    const alreadyLikedBlog = await Like.findOne({
      $and: [{ blog: blogId }, { likedBy: req.user?._id }],
    });
    if (!alreadyLikedBlog) {
      const createLikeOnBlog = await Like.create({
        blog: blogId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(new CustomApiResponse(200, blogId, "Blog Liked Successfully!"));
    }
    const removeLikeFromBlog = await Like.findByIdAndDelete(
      alreadyLikedBlog._id
    );
    return res
      .status(200)
      .json(new CustomApiResponse(200, blogId, "Blog Unliked Successfully!"));
  }
);

//toggle comment like
export const toggleCommentLike = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Comment Id!"));
    }
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res
        .status(404)
        .json(new CustomError(404, "Comment Doesn't Exist!"));
    }
    const alreadyLikedComment = await Like.findOne({
      $and: [{ comment: commentId }, { likedBy: req.user?.id }],
    });
    if (!alreadyLikedComment) {
      const likeComment = await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(
          new CustomApiResponse(200, commentId, "Comment Liked Successfully!")
        );
    }
    const unlikeComment = await Like.findByIdAndDelete(alreadyLikedComment._id);
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, commentId, "Comment Unliked Successfully!")
      );
  }
);

//toggle reply like
export const toggleReplyLike = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { replyId } = req.params;
    if (!isValidObjectId(replyId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Reply Id"));
    }
    const existingReply = await Reply.findById(replyId);
    if (!existingReply) {
      return res.status(404).json(new CustomError(404, "Reply Doesn't Exist!"));
    }
    const alreadyLikedReply = await Like.findOne({
      $and: [{ reply: replyId }, { likedBy: req.user?._id }],
    });
    if (!alreadyLikedReply) {
      const likeReply = await Like.create({
        reply: replyId,
        likedBy: req.user?._id,
      });
      return res
        .status(200)
        .json(new CustomApiResponse(200, replyId, "Reply Liked Successfully!"));
    }
    const unlikeReply = await Like.findByIdAndDelete(alreadyLikedReply._id);
    return res
      .status(200)
      .json(new CustomApiResponse(200, replyId, "Reply Unliked Successfully!"));
  }
);
