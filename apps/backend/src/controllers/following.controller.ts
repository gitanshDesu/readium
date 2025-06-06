import { UserDocumentType } from "@readium/database/user.model";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

// Follow and Unfollow a User
export const ToggleFollow = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

// Get all the followers of a user
export const getAllFollowers = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);

//Get all the users a user is following
export const getFollowedUsers = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {}
);
