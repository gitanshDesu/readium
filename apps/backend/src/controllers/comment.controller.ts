import { UserDocumentType } from "@readium/database/user.model";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const createComment = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Get all the comments under a blog (using blog id)
export const getAllComments = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Update a comment using comment id (only comment owner can update a comment)
export const editComment = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Delete a comment using comment id (only comment owner can delete a comment)
export const deleteComment = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
