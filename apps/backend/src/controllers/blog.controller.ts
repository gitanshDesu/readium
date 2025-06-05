import { Blog } from "@readium/database/blog.model";
import { UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { deleteFromS3, getUrlFromS3, uploadToS3 } from "@readium/utils/s3";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import path from "path";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const createBlog = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { title, content, tags } = req.body;

    //TODO: Add Input Validation for req.body using zod

    //1. get thumbnail and store it in DB
    const thumbnailFileName = req.file?.filename;
    if (!thumbnailFileName) {
      return res
        .status(400)
        .json(new CustomApiResponse(400, "Thumbnail File is Missing!"));
    }

    const key = thumbnailFileName + path.extname(req.file?.originalname!);

    const response = await uploadToS3(
      key,
      req.file?.path!,
      req.file?.mimetype!
    );

    if (!response) {
      return res
        .status(500)
        .json(
          new CustomError(500, "Error Occurred While Uploading Thumbnail!")
        );
    }
    const thumbnailUrl = await getUrlFromS3(key);
    if (!thumbnailUrl) {
      return res
        .status(500)
        .json(
          new CustomError(500, "Error Occurred while getting thumbnail url!")
        );
    }

    //TODO: 2. extract images and videos from content(JSON of markdown or something else[figure this out]) - Create a util for this. (Figure out should we upload images/videos to S3 or cloudinary from BE or should we upload them on FE and send the link here which we will store in DB)

    //3. Create blog using title content author = req.user?._id, tags and thumbnail
    const newBlog = await Blog.create({
      title,
      content,
      tags,
      thumbnail: thumbnailUrl,
      author: req.user?._id,
    });

    //TODO: 4. store extracted blog assets (image, videos) with tags in DB

    //5. Calculate word count read time - Create util for this
    const wordCount = newBlog.content.split(" ").length;
    const readTime = wordCount * 0.00390625; //In minutes
    newBlog.wordCount = wordCount;
    newBlog.readTime = readTime;
    await newBlog.save({ validateModifiedOnly: true });

    return res
      .status(201)
      .json(
        new CustomApiResponse(201, newBlog, "New Blog Created Successfully!")
      );
  }
);

//This controller will get all blogs based on search query, filters and sortType, user will also sent page and limit (to paginate data)
export const getAllBlogs = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

export const getBlogById = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.params;
    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Object Id!"));
    }
    const existingBlog = await Blog.findById(blogId).populate(
      "author",
      "-password - refreshToken -googleId -provider -isVerified"
    );
    if (!existingBlog) {
      return res.status(404).json(new CustomError(400, "No Such Blog Exists!"));
    }
    //Add blog in user's blog History;
    req.user?.blogHistory.push({
      blog: existingBlog._id,
      viewedAt: new Date(Date.now()), //pass Date like this because Date.now() returns a Number not Date Object so we have to create Date Object Like This,
    });
    //Note: we can extract date , month and year from viewedAt using getDate(), getMonth(), getFullYear() methods on viewedAt (as it is Date Object)
    await req.user?.save({ validateModifiedOnly: true });
    //return blog to client
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          existingBlog,
          "User Blog Fetched Successfully!"
        )
      );
  }
);

//update a blog using a id (only a blog authored by user can be updated)
export const updateBlog = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.params;
    const { title, content } = req.body; //title, content could be optional
    const newThumbnailFileName = req.file?.filename; //could be optional
    //TODO: Do input validation on req.body
    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Object Id!"));
    }
    const existingBlog = await Blog.findOne({
      $and: [{ _id: blogId }, { author: req.user?._id }],
    }).populate("author", "username firstName lastName avatar");
    if (!existingBlog) {
      return res.status(404).json(new CustomError(404, "Blog Doesn't Exist!"));
    }
    //if thumbnail exists
    if (newThumbnailFileName) {
      const key = newThumbnailFileName + path.extname(req.file?.originalname!);
      const uploadResponse = await uploadToS3(
        key,
        req.file?.path!,
        req.file?.mimetype!
      );
      if (!uploadResponse) {
        return res
          .status(500)
          .json(
            new CustomError(
              500,
              "Error Occurred while uploading new thumbnail!"
            )
          );
      }
      const newThumbnailUrl = await getUrlFromS3(key);
      if (!newThumbnailUrl) {
        return res
          .status(500)
          .json(
            new CustomError(
              500,
              "Error Occurred while getting url for thumbnail!"
            )
          );
      }
      existingBlog.thumbnail = newThumbnailUrl;
      await existingBlog.save({ validateModifiedOnly: true });
      //delete old thumbnail from S3
      const oldKey = existingBlog.thumbnail?.split("?")[0]?.split("/")[3]!;
      const deleteResponse = await deleteFromS3(oldKey);
      if (!deleteResponse) {
        return res
          .status(500)
          .json(
            new CustomError(500, "Error Occurred while deleting old thumbnail!")
          );
      }
    }
    //we have either title or content and not thumbnail
    if (title || content) {
      const updatedBlog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $set: {
            ...(title ? { title: title } : {}),
            ...(content ? { content: content } : {}),
          },
        },
        { new: true }
      );
      return res
        .status(200)
        .json(
          new CustomApiResponse(200, updatedBlog, "Blog Updated Successfully!")
        );
    }
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, existingBlog, "Blog Updated Successfully!")
      );
  }
);

//Delete a blog using a id (only a blog authored by user can be deleted)
export const deleteBlog = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

export const toggleBookMark = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
//TODO: Add feature to make blog public or private (by default private btw, we need to add field to Blog schema is published) => TogglePublish
