import { User, UserDocumentType } from "@readium/database/user.model";
import { NextFunction, Request, Response } from "express";

//need to export this else TS throws error: Exported variable 'registerUser' has or is using name 'CustomRequest' from external module
export interface CustomRequest extends Request {
  user?: UserDocumentType;
}

type RequestHandler = (
  req: CustomRequest,
  res: Response,
  next?: NextFunction
) => Promise<Response<any, Record<string, any>>> | Promise<unknown>;

export const tryCatchWrapper = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
