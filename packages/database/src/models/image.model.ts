import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    link: {
      type: String,
      required: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  },
  { timestamps: true }
);

export const Image = mongoose.model("Image", imageSchema);
