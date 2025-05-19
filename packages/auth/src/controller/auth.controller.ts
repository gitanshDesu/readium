/* 
 - register User:
    - Get username, fistName, lastName, password, email, avatar link
    - Validate username is unique, verify email; first check if email already exists; then check if email is legit by sending a magic link.
    - After all the validations and checks create a new user and save; create access and refresh token for them; save new user in DB;and at last return a 201 with new user data (username, firstName,lastName,avatar link)

*/
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

export const registerUser = tryCatchWrapper(
  async (req: Request, res: Response) => {
    return res.send("");
  }
);
