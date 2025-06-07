import mongoose, {
  AggregatePaginateModel,
  HydratedDocument,
  InferSchemaType,
  Model,
} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Image } from "./image.model";
import { Video } from "./video.model";

type IBlogAsset = {
  images: Array<mongoose.Types.ObjectId>;
  videos: Array<mongoose.Types.ObjectId>;
  tags: Array<mongoose.Types.ObjectId>;
};
interface IBlog {
  title: string;
  content: string;
  slug: string;
  isPublished: boolean;
  author: mongoose.Types.ObjectId;
  thumbnail: string;
  blogAssets: IBlogAsset;
  views: number;
  wordCount: number;
  readTime: number;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}

interface BlogMethods {
  slugifyTitle: (title: string) => string;
  generateUniqueSlug: (userId: mongoose.Types.ObjectId, slug: string) => string;
}

const blogAssetsSchema = new mongoose.Schema({
  images: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
  ],
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
});

const blogSchema = new mongoose.Schema<IBlog, Model<IBlog>, BlogMethods>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    slug: {
      // so that we can have unqiue URLs for each blog(even with blogs with duplicate title)
      type: String,
      required: true,
      unique: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    thumbnail: {
      type: String,
    },
    blogAssets: blogAssetsSchema,
    views: {
      type: Number,
      default: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    readTime: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
blogSchema.methods.slugifyTitle = (title: string) => {
  const slug = title.toLowerCase().replace(" ", "-");
  return slug;
};

blogSchema.methods.generateUniqueSlug = (
  userId: mongoose.Types.ObjectId,
  slug: string
) => {
  const uniqueSlug = slug.concat("-", userId.toString());
  return uniqueSlug;
};

//create slug pre-save using pre-save middleware
blogSchema.pre("save", function (next) {
  if (!this.isModified("title")) {
    return next();
  }
  const slugifyTitle = this.slugifyTitle(this.title);
  const slug = this.generateUniqueSlug(this._id, slugifyTitle);
  this.slug = slug;
  next();
});

//delete on cascade when we do blog.findByIdAndDelete()
blogSchema.post("findOneAndDelete", async function () {
  const blog = this.getQuery()?._id;
  await Image.deleteMany({ blog });
  await Video.deleteMany({ blog });
});

type SchemaType = InferSchemaType<typeof blogSchema>;

export type BlogDocumentType = HydratedDocument<SchemaType>;

blogSchema.plugin(mongooseAggregatePaginate);

//Need to add type of aggregate paginate plugin on Model to make TS let use methods provided by aggregate paginate plugin on Blog model w/o ts 2339 error.
export const Blog = mongoose.model<IBlog, AggregatePaginateModel<IBlog>>(
  "Blog",
  blogSchema
);
