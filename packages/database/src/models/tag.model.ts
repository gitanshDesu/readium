import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

type schemaType = InferSchemaType<typeof tagSchema>;
export type TagDocumentType = HydratedDocument<schemaType>;

tagSchema.plugin(mongooseAggregatePaginate);

export const Tag = mongoose.model("Tag", tagSchema);
