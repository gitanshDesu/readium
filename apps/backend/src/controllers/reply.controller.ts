import { UserDocumentType } from "@readium/database/user.model";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const createReply = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Get all Replies under a comment or reply (using comment id or reply id [To get all replies under a reply we might need both comment id and reply id (ponder about this while trying to figure out algo for this controller)])
export const getAllReplies = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Edit a reply using reply id (only reply owner can edit a reply)
export const editReply = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Delete a reply using reply id (only reply owner can delete a reply)
export const deleteReply = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
