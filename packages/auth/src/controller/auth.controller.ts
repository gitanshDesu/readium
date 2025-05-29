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
import { sendMail } from "../helper/sendMail.helper";
import { verifyEmail } from "../helper/verifyEmail.helper";
import { use } from "passport";
import { resetPassword } from "../helper/resetPassword.helper";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

type MixedRequest = CustomRequest & Request;

export const registerUser = tryCatchWrapper<Request>(
  async (req: Request, res: Response) => {
    const { username, firstName, lastName, password, email } = req.body;

    //TODO: 2. Get avatar image from req.file using multer

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

    //4. if correct inputs check if username and email are unique (i.e. no other user with same username and email exists)

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      return res
        .status(400)
        .json(new CustomError(400, "username and email taken already!"));

      // It is recommended to not tell exactly that either username sent or email sent is already taken for security
    }

    const newUser = await User.create({
      username,
      firstName,
      lastName,
      email,
      password,
    });

    //TODO: 6. Send magic link / verification code to verify email of user, and toggle isVerified === true

    const mailResponse = await sendMail(newUser, "VERIFY");
    console.log(mailResponse);

    // if (!newUser.isVerified) {
    //   return res.status(401).json(new CustomError(401, "Verify Email First!"));
    // }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      newUser.username
    );

    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
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
    if (!existingUser.isVerified) {
      // Send Mail on user's email with verification code
      const mailResponse = await sendMail(existingUser, "VERIFY");
      return res
        .status(401)
        .json(
          new CustomError(
            401,
            "Please Verify Your Email! Check Your Mail for Valid Verification Code!"
          )
        );
    }

    //5. Check if the password sent is correct; if not send 401, Invalid password
    const isPasswordValid = await existingUser.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).json(new CustomError(401, "Invalid Password!"));
    }

    //6. generate access and refersh tokens, and set refershToken in existingUser.refeshToken field

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      existingUser.username
    );

    existingUser.refreshToken = refreshToken;
    await existingUser.save({ validateBeforeSave: true });

    //7. set cookies for access token and refersh token and send 200 response
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
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

//TODO: Add Input Validation in verifyEmailHandler and resetPasswordHandler controller.

export const verifyEmailHandler = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { verificationCode } = req.body;
    const isVerified = await verifyEmail(req.user!, verificationCode);
    if (isVerified) {
      return res
        .status(200)
        .json(new CustomApiResponse(200, {}, "Email Verified Successfully!"));
    }
    //isVerified is false it means either verification code is wrong or user has exceeded verification code expiry
    //In this case again send verification code
    const mailResponse = await sendMail(req.user!, "VERIFY");
    return res
      .status(200)
      .json(
        new CustomApiResponse(400, "Invalid Verification Code Send! Retry!")
      );
  }
);

//TODO: Edge Case Test try to hit this end point and other endpoints with google login and see what happens
export const resetPasswordHandler = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { oldPassword, verificationCode, newPassword } = req.body;
    //1. check if password sent is correct.
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json(new CustomError(404, "User Doesn't Exist!"));
    }
    const isValidPassword = await user?.isPasswordCorrect(oldPassword);
    if (!isValidPassword) {
      return res.status(400).json(new CustomError(400, "Invalid Password"));
    }
    //2. send mail with verification code to reset password
    const mailResponse = await sendMail(user, "RESET");
    //3. reset password
    const isPasswordReset = await resetPassword(
      user,
      newPassword,
      verificationCode
    );
    if (!isPasswordReset) {
      // it means verification code sent is incorrect, send another for retry.
      await sendMail(user, "RESET");
      return res
        .status(400)
        .json(
          new CustomError(400, "Verification Code sent is Invalid! Retry!")
        );
    }
    return res
      .status(200)
      .json(new CustomApiResponse(200, {}, "Password Reset Successfully!"));
  }
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

export const refershAccessTokenHandler = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new CustomError(401, "Unauthorized Request!");
    }
    try {
      const decodedToken: JwtPayload = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      ) as JwtPayload;
      const user = await User.findById(decodedToken?._id);
      if (!user) {
        throw new CustomError(401, "Invalid Refresh Token");
      }
      if (incomingRefreshToken !== user?.refreshToken) {
        throw new CustomError(401, "Refresh Token is Expired or Used");
      }
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user.username
      );
      const options = {
        httpOnly: true,
        secure: true,
      };
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new CustomApiResponse(
            200,
            { accessToken, refreshToken },
            "Access Token Refreshed"
          )
        );
    } catch (error) {
      console.log("Error Occurred while Refreshing Access Token: ", error);
      throw new CustomError(401, "Invalid Refresh Token");
    }
  }
);
