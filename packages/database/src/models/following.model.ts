import mongoose from "mongoose";

const followingSchema = new mongoose.Schema(
  {
    follower: {
      // Here goes - us (who followed xyz person)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    following: {
      // Here goes People we follow
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Following = mongoose.model("Following", followingSchema);
