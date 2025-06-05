import mongoose, { HydratedDocument, InferSchemaType, Model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

type IBlogAsset = {
  images: Array<mongoose.Types.ObjectId>;
  videos: Array<mongoose.Types.ObjectId>;
  tags: Array<mongoose.Types.ObjectId>;
};
interface IBlog {
  title: string;
  content: string;
  slug: string;
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

type SchemaType = InferSchemaType<typeof blogSchema>;

export type BlogDocumentType = HydratedDocument<SchemaType>;

blogSchema.plugin(mongooseAggregatePaginate);

export const Blog = mongoose.model("Blog", blogSchema);
