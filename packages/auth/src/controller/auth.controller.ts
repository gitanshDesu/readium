/* 
 - register User:
    - Get username, fistName, lastName, password, email, avatar link
    - Validate username is unique, verify email; first check if email already exists; then check if email is legit by sending a magic link.
    - After all the validations and checks create a new user and save; create access and refresh token for them; save new user in DB;and at last return a 201 with new user data (username, firstName,lastName,avatar link)

*/
import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { generateAccessAndRefreshToken } from "@readium/utils/generateTokens";
import { registerUserInputSchema } from "@readium/zod/registerUser";
import { loginUserInputSchema } from "@readium/zod/loginUser";
import { Request, Response } from "express";
import { z } from "zod/v4";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

export const registerUser = tryCatchWrapper<Request>(
  async (req: Request, res: Response) => {
    //1. Get username,firstName,lastName,password,email from req.body
    const { username, firstName, lastName, password, email } = req.body;
    //TODO: 2. Get avatar image from req.file using multer

    //3. do z.safeParse() to validate req.body object we get has correct inputs.
    if (
      !z.safeParse(registerUserInputSchema, {
        username,
        firstName,
        lastName,
        password,
        email,
      }).success
    ) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Correct User fields!"));
    }

    console.log(req.body);

    //4. if correct inputs check if username and email are unique (i.e. no other user with same username and email exists)

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      if (existingUser.username === username && existingUser.email === email) {
        return res
          .status(400)
          .json(new CustomError(400, "username and email taken already!"));
      }
      if (existingUser.username === username) {
        return res
          .status(400)
          .json(new CustomError(400, "username taken already!"));
      }
      if (existingUser.email === email) {
        return res
          .status(400)
          .json(new CustomError(400, "email already exists!"));
      }
    }

    //5. After email is verified create new user using username, firstName, lastName, email,password (password will get hashed pre-save(thanks to pre-save hook))

    const newUser = await User.create({
      username,
      firstName,
      lastName,
      email,
      password,
    });

    //TODO: 6. Send magic link to verify email of user, and toggle isVerified === true

    // if (!newUser.isVerified) {
    //   return res.status(401).json(new CustomError(401, "Verify Email First!"));
    // }

    //7. generate access and refresh token and update refersh token field with refersh token (this step will let user to access protected endpoints after registering).

    const { accessToken, refershToken } = await generateAccessAndRefreshToken(
      newUser.username
    );
    //TODO: Test if accessToken and refershToken are generated correctly: Create Route to register user in apps/backend and start testing in postman

    console.log(accessToken, refershToken);

    newUser.refreshToken = refershToken;
    await newUser.save();

    //8. set access token in cookies

    //9. Return created user as response data with 201 status code and user created successfully message.
    return res
      .status(201)
      .json(new CustomApiResponse(200, newUser, "User Created Successfully!"));
  }
);

export const loginUser = tryCatchWrapper<Request>(
  async (req: Request, res: Response) => {
    //1. get username, email, password from req.body
    const { username, email, password } = req.body;

    //TODO: 2. Do input validation of received object in req.body using z.safeParse()

    if (!z.safeParse(loginUserInputSchema, { username, email, password })) {
    }

    //3. Find if unique user exists and if don't send 404 error
    const existingUser = await User.findOne({
      $and: [{ username }, { email }],
    }).select("-blogHistory -bookmarks"); // cannot do -password in .select because of doing -password existingUser won't contain password field because of which existingUser.password === undefined and doing existingUser.isPasswordCorrect(password) will yield an Error because we will be having this.password === undefined; where this === existingUser

    if (!existingUser) {
      return res
        .status(404)
        .json(
          new CustomError(404, "User Does Not Exist! Register Instead of Login")
        );
    }

    //TODO: 4. Check if email sent is verified, if not return 401, Please verify email!

    //5. Check if the password sent is correct; if not send 401, Invalid password
    const isPasswordValid = await existingUser.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).json(new CustomError(401, "Invalid Password!"));
    }

    //6. generate access and refersh tokens, and set refershToken in existingUser.refeshToken field

    const { accessToken, refershToken } = await generateAccessAndRefreshToken(
      existingUser.username
    );

    existingUser.refreshToken = refershToken;
    await existingUser.save();

    //7. set cookies for access token and refersh token and send 200 response
    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refershToken)
      .json(
        new CustomApiResponse(200, existingUser, "User Logged In Successfully!")
      );
  }
);

export const loginViaGoogleHandler = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    res.status(200).redirect(process.env.FRONTEND_REDIRECT_URI);
  }
);
