import mongoose, {
  AggregatePaginateModel,
  HydratedDocument,
  InferSchemaType,
} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface ITag {
  name: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

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

//plugin should be above when infering type of schema - to include plugin type in schema - otherwise we will get errors
tagSchema.plugin(mongooseAggregatePaginate);

type schemaType = InferSchemaType<typeof tagSchema>;
export type TagDocumentType = HydratedDocument<schemaType>;

export const Tag = mongoose.model<ITag, AggregatePaginateModel<ITag>>(
  "Tag",
  tagSchema
);
