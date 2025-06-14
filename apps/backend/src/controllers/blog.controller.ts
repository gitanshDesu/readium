import { Blog } from "@readium/database/blog.model";
import { Tag, TagDocumentType } from "@readium/database/tag.model";
import { UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { deleteFromS3, getUrlFromS3, uploadToS3 } from "@readium/utils/s3";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import path from "path";
import {
  createBlogBodySchema,
  CreateBlogBodyType,
  CreateBlogQueryType,
  createBlogQuerySchema,
} from "@readium/zod/createBlog";
import { updateBlogInputSchema } from "@readium/zod/updateBlog";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

const getArrayOfTagIds = async (tags: string | string[] | undefined) => {
  try {
    //handle when tags is not an array but string i.e. when someone sends only 1 tag
    if (!tags) {
      return [];
    }
    if (!Array.isArray(tags) || typeof tags !== "string") {
      console.error("Expected array or string but got:", typeof tags, tags);
      throw new CustomError(400, "Tags must be an array of strings");
    }
    if (typeof tags === "string" && Array.isArray(JSON.parse(tags))) {
      console.error("Expected array or string but not a stringyfied array");
      throw new CustomError(
        400,
        "Tags must be Array or a string and not stringyfied array!"
      );
    }
    if (
      typeof tags === "string" &&
      !Array.isArray(JSON.parse(tags)) &&
      !Array.isArray(tags)
    ) {
      const tagDoc = await Tag.findOne({ name: tags });
      const tagId = tagDoc?._id;
      return tagId;
    }
    const allTagDocs = await Promise.all(
      (tags as string[]).map((tagName) => Tag.findOne({ name: tagName }))
    ); //returns null when no docs found

    if (allTagDocs.length === 0) {
      throw new CustomError(404, "No Tags Exist!");
    }

    const allTagsId = allTagDocs
      .filter((tag) => tag !== null) //filter out null elements
      .map((tag: TagDocumentType) => tag?._id); //now no null values present so need to add null type with TagDocumentType

    return allTagsId;
  } catch (error) {
    //TODO: Add Custom Error
    console.log("Error Occurred while extracting Tag Documents: \n ", error);
  }
};

export const createBlog = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { title, content }: CreateBlogBodyType = req.body;
    const { tags = [] }: CreateBlogQueryType = req.query;

    const validation = createBlogBodySchema.safeParse(req.body);

    const queryValidation = createBlogQuerySchema.safeParse(req.query);

    if (!validation.success || !queryValidation.success) {
      return res
        .status(400)
        .json(
          new CustomError(
            400,
            validation.error?.message || queryValidation.error?.message
          )
        );
    }

    //1. get thumbnail and store it in DB
    //make providing thumbnail optional
    const thumbnailFileName = req.file?.filename;
    let thumbnailUrl: string | undefined = "";
    if (thumbnailFileName) {
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
      thumbnailUrl = await getUrlFromS3(key);
      if (!thumbnailUrl) {
        return res
          .status(500)
          .json(
            new CustomError(500, "Error Occurred while getting thumbnail url!")
          );
      }
    }

    //TODO: 2. extract images and videos from content(JSON of markdown or something else[figure this out]) - Create a util for this. (Figure out should we upload images/videos to S3 or cloudinary from BE or should we upload them on FE and send the link here which we will store in DB)

    //3. Create blog using title content author = req.user?._id, tags and thumbnail
    const newBlog = await Blog.create({
      title,
      content,
      thumbnail: thumbnailUrl || "",
      author: req.user?._id,
      blogAssets: {
        //I have to initialize blogAssets object otherwise mongoose doesn't set this path in mongo and blogAssets Object remains undefined.
        images: [],
        videos: [],
        tags: [],
      },
      slug: title, // I have to give slug(as slug is required path) otherwise mongoose throws slug required validation error
    });

    //TODO: 4. store extracted blog assets (image, videos) with tags in DB

    //5. Calculate word count read time
    const allTagsId = await getArrayOfTagIds(tags as string[]);

    const wordCount = newBlog.content.split(" ").length;
    const readTime = wordCount * 0.00390625; //In minutes

    newBlog.wordCount = wordCount;
    newBlog.readTime = readTime;

    //Add tag ids in blogAssets.tags array
    if (!Array.isArray(allTagsId)) {
      newBlog.blogAssets.tags.push(allTagsId!);
    }
    if (Array.isArray(allTagsId)) {
      newBlog.blogAssets.tags = allTagsId!;
    }

    await newBlog.save({ validateModifiedOnly: true }); //have to do this otherwise;

    return res
      .status(201)
      .json(
        new CustomApiResponse(201, newBlog, "New Blog Created Successfully!")
      );
  }
);

export const getBlogById = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.params;
    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Object Id!"));
    }
    const existingBlog = await Blog.findById(blogId)
      .populate(
        "author",
        "-password -refreshToken -googleId -provider -isVerified -email"
      )
      .populate("blogAssets.tags", "name"); //test this logic
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

    const validation = updateBlogInputSchema.safeParse(req.body);

    if (!validation.success) {
      return res
        .status(400)
        .json(new CustomError(400, validation.error.message));
    }

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
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.params;
    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Object Id!"));
    }
    const existingBlog = await Blog.findOne({
      $and: [{ _id: blogId }, { author: req.user?._id }],
    });
    if (!existingBlog) {
      return res.status(404).json(new CustomError(404, "Blog Doesn't Exist!"));
    }

    //delete thumbnail from S3

    const thumbnail = existingBlog.thumbnail;

    const key = thumbnail?.split("?")[0]?.split("/")[3]!;
    const response = await deleteFromS3(key);
    if (!response) {
      throw new CustomError(500, "Error Occurred While Deleting Old Avatar!");
    }

    //TODO: Also Delete Blog Assets- Images and Videos from S3 as well

    const deletedBlog = await Blog.findOneAndDelete({ _id: existingBlog._id });
    if (!deleteBlog) {
      return res
        .status(500)
        .json(new CustomError(500, "Error Occurred while deleting blog!"));
    }
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, deletedBlog, "Blog Deleted Successfully!")
      );
  }
);

export const toggleBookMark = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.params;
    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Valid Object Id!"));
    }
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) {
      return res
        .status(404)
        .json(new CustomError(404, "The Blog Doesn't Exist!"));
    }
    //Check if the blog is already in bookmarks array if yes then filter out and if no then push
    const doesBlogExist = req.user?.bookmarks.includes(
      new mongoose.Types.ObjectId(blogId)
    );
    if (!doesBlogExist) {
      //then push blog into user's bookmarks
      req.user?.bookmarks.push(new mongoose.Types.ObjectId(blogId));
      await req.user?.save({ validateModifiedOnly: true });
      return res
        .status(200)
        .json(
          new CustomApiResponse(
            200,
            blogId,
            "Blog Added To Bookmarks Successfully!"
          )
        );
    }
    //filter the blog out of the bookmarks array
    req.user!.bookmarks = req.user!.bookmarks.filter(
      (id) => !id.equals(blogId)
    );
    await req.user?.save({ validateModifiedOnly: true });
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          blogId,
          "Blog Removed From Bookmarks Successful!"
        )
      );
  }
);
//TODO: Add feature to make blog public or private (by default private btw, we need to add field to Blog schema is published) => TogglePublish
export const togglePublish = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { blogId } = req.params;
    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .json(new CustomError(400, "Provide Valid Object Id!"));
    }
    //make sure req.user is the author (only author of blog can toggle their publish status)
    const existingBlog = await Blog.findOne({
      $and: [{ _id: blogId }, { author: req.user?._id }],
    });
    if (!existingBlog) {
      return res.status(404).json(new CustomError(404, "Blog Doesn't Exist!"));
    }
    existingBlog.isPublished = !existingBlog.isPublished;
    await existingBlog.save({ validateModifiedOnly: true });
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          existingBlog.isPublished,
          "Blog's Publish Status Toggled successfully!"
        )
      );
  }
);
