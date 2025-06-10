import mongoose, { AggregatePaginateModel } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Reply } from "./reply.model";

interface IComment {
  content: string;
  blog: mongoose.Types.ObjectId;
  commentedBy: mongoose.Types.ObjectId;
  replies?: Array<mongoose.Types.ObjectId>;
  repliesCount: number;
}

const commentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

//TODO: Add pre hook to calculate repliesCount (!replies.isModified -> next) else repliesCount = replies.length() and update this field in Comment Model

commentSchema.post("findOneAndDelete", async function () {
  const comment = this.getQuery()?._id;
  await Reply.deleteMany({ comment });
});

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model<
  IComment,
  AggregatePaginateModel<IComment>
>("Comment", commentSchema);
