import { Comment } from "@readium/database/comment.model";
import { Reply } from "@readium/database/reply.model";
import { UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";

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
        existingReply?.replies.push(newReply._id);
        await existingReply?.save({ validateModifiedOnly: true });
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

//Get all Replies under a comment using commentId
//TODO: Think about how reply under a reply under a reply (how to get this dense or inner inner replies?)
export const getAllReplies = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    //reply id can be optional
    const { commentId, replyId } = req.body;

    if (!isValidObjectId(commentId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Comment Id!"));
    }
    //TODO: Add logic to bring all replies under replies here as well
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res
        .status(404)
        .json(new CustomError(404, "Comment Doesn't Exist!"));
    }

    const allReplies = await Reply.aggregate([
      {
        $match: {
          comment: new mongoose.Types.ObjectId(commentId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "repliedBy",
          foreignField: "_id",
          as: "repliedBy",
          pipeline: [
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
      {
        $lookup: {
          from: "replies",
          as: "replies",
          foreignField: "_id",
          localField: "replies",
          pipeline: [
            {
              $lookup: {
                from: "users",
                as: "repliedBy",
                localField: "repliedBy",
                foreignField: "_id",
                pipeline: [
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
            {
              $project: {
                repliedBy: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                repliedUnder: 1,
                replies: 1,
              },
            },
            {
              $addFields: {
                repliedBy: {
                  $first: "$repliedBy",
                },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          repliedBy: {
            $first: "$repliedBy",
          },
        },
      },
    ]);
    //TODO: Based on output complete this controller
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          allReplies,
          "All Replies Fetched Successfully"
        )
      );
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
    }).select("-replies -comment -reply -repliesCount");
    if (!existingReply) {
      return res.status(404).json(new CustomError(404, "Reply Doesn't Exist!"));
    }
    existingReply.content = content;
    await existingReply.save({ validateModifiedOnly: true });
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          { content: existingReply.content, _id: existingReply._id },
          "Reply Edited Successfully!"
        )
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
