import { UserDocumentType } from "@readium/database/user.model";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

//toggle blog like
export const toggleBlogLike = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//toggle comment like
export const toggleCommentLike = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//toggle reply like
export const toggleReplyLike = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
