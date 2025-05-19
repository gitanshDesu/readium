import { NextFunction, Request, Response } from "express";

type InputFunction = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<Response<any, Record<string, any>>>;

export const tryCatchWrapper = (fn: InputFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
