import mongoose from "mongoose";

interface IReply {
  content: string;
  repliedBy: mongoose.Types.ObjectId;
  repliedUnder: string;
  comment: mongoose.Types.ObjectId;
  reply: mongoose.Types.ObjectId;
  replies: Array<mongoose.Types.ObjectId>;
  repliesCount: number;
}

const replySchema = new mongoose.Schema<IReply>(
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

//TODO: Add pre hook to calculate repliesCount (!replies.isModified -> next) else repliesCount = replies.length() and update this field in Reply Model

replySchema.post("findOneAndDelete", async function () {
  const reply = this.getQuery()?._id;
  await Reply.deleteMany({ reply });
});

export const Reply = mongoose.model<IReply>("Reply", replySchema);
