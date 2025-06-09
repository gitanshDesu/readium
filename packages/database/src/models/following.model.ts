import mongoose from "mongoose";

const followingSchema = new mongoose.Schema(
  {
    follower: {
      // followedBy
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    following: {
      // Person we are following
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Following = mongoose.model("Following", followingSchema);
