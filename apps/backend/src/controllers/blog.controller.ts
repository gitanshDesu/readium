import { UserDocumentType } from "@readium/database/user.model";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const createBlog = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { title, content, tags } = req.body;

    //TODO: Add Input Validation for req.body using zod

    //1. get thumbnail and store it in DB

    //TODO: Create slug (unique - userId and slugified title - Create util for this as well) for each blog to have some unique-ness so that we can have unique URL for each blog

    //2. extract images and videos from content(JSON of markdown or something else[figure this out]) - Create a util for this. (Figure out should we upload images/videos to S3 or cloudinary from BE or should we upload them on FE and send the link here which we will store in DB)

    //3. Create blog using title content author = req.user?._id

    //4. store extracted blog assets (image, videos) with tags in DB

    //5. Calculate word count read time - Create util for this
  }
);

//This controller will get all blogs based on search query, filters and sortType, user will also sent page and limit (to paginate data)
export const getAllBlogs = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

export const getBlogById = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//update a blog using a id (only a blog authored by user can be updated)
export const updateBlog = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Delete a blog using a id (only a blog authored by user can be deleted)
export const deleteBlog = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//TODO: Add feature to make blog public or private (by default private btw, we need to add field to Blog schema is published) => TogglePublish
