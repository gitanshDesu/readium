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

type MixedRequest = CustomRequest & Request;

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

    //TODO: 6. Send magic link / verification code to verify email of user, and toggle isVerified === true

    // if (!newUser.isVerified) {
    //   return res.status(401).json(new CustomError(401, "Verify Email First!"));
    // }

    //7. generate access and refresh token and update refersh token field with refersh token (this step will let user to access protected endpoints after registering).

    const { accessToken, refershToken } = await generateAccessAndRefreshToken(
      newUser.username
    );

    newUser.refreshToken = refershToken;
    await newUser.save();

    const options = {
      httpOnly: true,
      secure: true,
    };

    //9. Set access token and refersh tokens in cookies && Return created user as response data with 201 status code and user created successfully message.
    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refershToken, options)
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
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refershToken, options)
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

//NOTE: Since we are now doing auth using 2 methods in which we setup session in one (oauth) and in another we set up access and refersh token inside cookies. Hence, in protected routes we need to make sure we account for both the methods i.e. we do if (req. && provider === "google") { //if used session }; else {// in case access and refershToken are used} or we might not need this step (but test with and without this step)

export const verifyEmailHandler = tryCatchWrapper<Request>(
  async (req: Request, res: Response) => {}
);

export const resetPasswordHandler = tryCatchWrapper<Request>(
  async (req: Request, res: Response) => {}
);

export const LogoutHandler = tryCatchWrapper<MixedRequest>(
  async (req: MixedRequest, res: Response) => {
    //Needed to terminate login session created by Password-this function is exposed on `req` by Passport.js only.
    if (req.user && req.user.provider === "google") {
      req.logOut((err: Error) => {
        console.log("Error occured while logging user out: ", err);
      });
      return res
        .status(200)
        .json(new CustomApiResponse(200, {}, "User Logged Out Successfully!"));
    } else {
      await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            refreshToken: undefined,
          },
        },
        { new: true }
      );
      const options = {
        httpOnly: true,
        secure: true,
      };
      return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new CustomApiResponse(200, {}, "User Logged Out Successfully"));
    }
  }
);

//As we modified isLoggedIn middleware to handle the case of session set up by passport, so we don't need another route, we can freely use isLoggedIn middleware to cover both passport and local auth cases.

// export const localAuthLogoutHandler = tryCatchWrapper<CustomRequest>(
//   async (req: CustomRequest, res: Response) => {
//     await User.findByIdAndUpdate(
//       req.user?._id,
//       {
//         $set: {
//           refreshToken: undefined,
//         },
//       },
//       { new: true }
//     );
//     const options = {
//       httpOnly: true,
//       secure: true,
//     };
//     return res
//       .status(200)
//       .clearCookie("accessToken", options)
//       .clearCookie("refreshToken", options)
//       .json(new CustomApiResponse(200, {}, "User Logged Out Successfully"));
//   }
// );
