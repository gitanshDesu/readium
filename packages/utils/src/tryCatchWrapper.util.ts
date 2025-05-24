import { NextFunction, Request, Response } from "express";

type AsyncHandler<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const tryCatchWrapper = <T extends Request = Request>(
  fn: AsyncHandler<T>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch((err) => next(err));
  };
};
