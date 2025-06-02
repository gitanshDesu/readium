import { UserDocumentType } from "@readium/database/user.model";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

//Create a Tag
export const createTag = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Get All Tags (based on category, query, filter)
export const getAllTags = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Edit a tag (only owner of a tag can edit their tag(s))
export const editTag = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Delete a tag (only owner of a tag can delete their tag(s))
export const deleteTag = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
