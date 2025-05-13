import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    repliedUnder: {
      type: String,
      enum: ["reply", "comment"],
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    reply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reply",
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reply",
      },
    ],
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Reply = mongoose.model("Reply", replySchema);
