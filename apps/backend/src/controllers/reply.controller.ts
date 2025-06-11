import { Comment } from "@readium/database/comment.model";
import { Reply } from "@readium/database/reply.model";
import { UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const createReply = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //sending replyId is optional
    const { commentId, replyId, repliedUnder, content } = req.body;
    if (content?.trim() === "") {
      return res
        .status(400)
        .json(new CustomError(400, "content field is required!"));
    }
    if (repliedUnder !== "comment" && repliedUnder !== "reply") {
      return res
        .status(400)
        .json(new CustomError(400, "Send Correct repliedUnder option!"));
    }
    //TODO: Add Input Validation for req.body
    //logic to reply under a comment
    if (!isValidObjectId(commentId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Comment or Reply Id!"));
    }
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res
        .status(404)
        .json(new CustomError(404, "Comment Doesn't Exist!"));
    }
    if (repliedUnder === "comment") {
      const newReply = await Reply.create({
        content,
        repliedUnder,
        comment: commentId,
        repliedBy: req.user?._id,
      }).then((newReply) =>
        newReply.populate("repliedBy", "username firstName lastName avatar")
      );
      existingComment.replies?.push(newReply._id);
      await existingComment.save({ validateModifiedOnly: true });
      return res
        .status(200)
        .json(
          new CustomApiResponse(
            200,
            newReply,
            "Reply Under Comment Added Successfully!"
          )
        );
    }
    //logic for commenting under a reply
    if (replyId) {
      if (!isValidObjectId(commentId) || !isValidObjectId(replyId)) {
        return res
          .status(400)
          .json(new CustomError(400, "Send Valid Comment or Reply Id!"));
      }
      const existingReply = await Reply.findById(replyId);
      if (existingComment) {
        if (!existingReply) {
          return res
            .status(404)
            .json(new CustomError(404, "Reply Doesn't Exist!"));
        }
      }
      if (repliedUnder === "reply") {
        const newReply = await Reply.create({
          content,
          repliedUnder,
          reply: replyId,
          repliedBy: req.user?._id,
        }).then((newReply) =>
          newReply.populate("repliedBy", "username firstName lastName avatar")
        );
        newReply.replies.push(newReply._id);
        await newReply.save({ validateModifiedOnly: true });
        return res
          .status(200)
          .json(
            new CustomApiResponse(
              200,
              newReply,
              "Reply Added Under A Reply Successfully!"
            )
          );
      }
    }
  }
);

//Get all Replies under a comment or reply (using comment id or reply id [To get all replies under a reply we might need both comment id and reply id (ponder about this while trying to figure out algo for this controller)])
export const getAllReplies = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //reply id can be optional
    const { commentId, replyId } = req.body;

    if (!isValidObjectId(commentId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Comment Id!"));
    }
    const existingComment =
      await Comment.findById(commentId).populate("replies");
    if (!existingComment) {
      return res
        .status(404)
        .json(new CustomError(404, "Comment Doesn't Exist!"));
    }
    //Test output
    console.log(existingComment.replies);
    //TODO: Based on output complete this controller
  }
);

//Edit a reply using reply id (only reply owner can edit a reply)
export const editReply = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { replyId } = req.params;
    const { content } = req.body;
    if (content?.trim() === "") {
      return res
        .status(400)
        .json(new CustomError(400, "Content field is required!"));
    }
    //TODO: Add input validation for req.body
    if (!isValidObjectId(replyId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Reply Id!"));
    }
    const existingReply = await Reply.findOne({
      $and: [{ _id: replyId }, { repliedBy: req.user?._id }],
    }).select("-repliedBy -replies -comment -reply repliesCount");
    if (!existingReply) {
      return res.status(404).json(new CustomError(404, "Reply Doesn't Exist!"));
    }
    existingReply.content = content;
    await existingReply.save({ validateModifiedOnly: true });
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, existingReply, "Reply Edited Successfully!")
      );
  }
);

//Delete a reply using reply id (only reply owner can delete a reply)
export const deleteReply = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { replyId } = req.params;
    if (!isValidObjectId(replyId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Reply Id!"));
    }
    const existingReply = await Reply.findOne({
      $and: [{ _id: replyId }, { repliedBy: req.user?._id }],
    }).select("-repliedBy -comment -reply -replies -repliesCount");
    if (!existingReply) {
      return res.status(404).json(new CustomError(404, "Reply Doesn't Exist!"));
    }
    const deletedReply = await Reply.findOneAndDelete({
      _id: existingReply._id,
    });
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, existingReply, "Reply Deleted Successfully!")
      );
  }
);
