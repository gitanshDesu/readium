import mongoose from "mongoose";

const followingSchema = new mongoose.Schema({});

export const Following = mongoose.model("Following", followingSchema);
