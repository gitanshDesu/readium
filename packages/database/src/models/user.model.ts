import mongoose, { HydratedDocument, InferSchemaType, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { Blog } from "./blog.model";
import { Comment } from "./comment.model";
import { Reply } from "./reply.model";
import { Image } from "./image.model";
import { Video } from "./video.model";
import { Following } from "./following.model";
import jwt from "jsonwebtoken";

interface IBlogHistory {
  blog: mongoose.Types.ObjectId;
  viewedAt: Date;
}
interface IUser {
  googleId?: string;
  provider?: string;
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  isVerified: boolean;
  avatar?: string;
  password: string;
  bookmarks: Array<mongoose.Types.ObjectId>;
  blogHistory: Array<IBlogHistory>;
  refreshToken: string | undefined;
  createdAt: NativeDate;
  updatedAt: NativeDate;
}
interface UserMethods {
  //TODO: find and set correct type for "this" in isPasswordCorrect method
  isPasswordCorrect(this: IUser, password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const blogHistorySchema = new mongoose.Schema({
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema<IUser, Model<IUser>, UserMethods>(
  {
    googleId: {
      type: String, // unique id returned after SSO with Google
      sparse: true, // Allows document without googleId (for e.g. in local signups)
    },
    provider: {
      type: String, // store provider if used google / any other provider like github,twitter,facebook etc.
    },
    username: {
      type: String,
      unique: true, //index, not a validator
      required: true,
      lowercase: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true, // to make sure user can create only a single account with an email.
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // toggle to true after user verifies its email
    },
    avatar: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],
    blogHistory: [blogHistorySchema],
    refreshToken: {
      type: String,
      default: undefined,
    },
  },
  { timestamps: true }
);

//pre-save hook to hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//Adding method to check if password is correct
userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

//Adding method to generate access and refresh token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this?._id,
      email: this?.email,
      username: this?.username,
      firstName: this?.firstName,
      lastName: this?.lastName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY!,
    }
  );
};

//post hook to delete all user's blogs,likes,replies,comment,after user is deleted successfully - similar to delete on Cascade SQL
userSchema.post("findOneAndDelete", async function () {
  console.log(this.getQuery());
  const author = this.getQuery()?._id;
  await Comment.deleteMany({ commentedBy: author });
  await Reply.deleteMany({ repliedBy: author });
  //if all blogs are getting deleted we don't need image and video links assets in each blog in our DB.So, first delete images and videos
  const allAuthorBlogs = await this.find({ author });
  allAuthorBlogs.map(async (blog) => {
    await Image.deleteMany({ blog: blog._id });
    await Video.deleteMany({ blog: blog._id });
  });
  //now delete all the blogs
  await Blog.deleteMany({ author });
  //Remove author followers
  await Following.deleteMany({ following: author });
  //Remove author from other author's follower's list
  await Following.deleteMany({ follower: author });
});

//extracting type of User Document so that we can set type in CustomRequest interface in auth middleware
type SchemaType = InferSchemaType<typeof userSchema>;
export type UserDocumentType = HydratedDocument<SchemaType>;

const User = mongoose.model("User", userSchema);

export { User };
