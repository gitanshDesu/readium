import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { generateAccessAndRefreshToken } from "@readium/utils/generateTokens";
import { registerUserInputSchema } from "@readium/zod/registerUser";
import { loginUserInputSchema } from "@readium/zod/loginUser";
import { resetPasswordInputSchema } from "@readium/zod/resetPassword";
import { forgotPasswordInputSchema } from "@readium/zod/forgotPassword";
import { verifyEmailInputSchema } from "@readium/zod/verifyEmail";
import { Request, Response } from "express";
import { sendMail } from "../helper/sendMail.helper";
import { verifyEmail } from "../helper/verifyEmail.helper";
import { resetPassword } from "../helper/resetPassword.helper";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

type MixedRequest = CustomRequest & Request;

export const registerUser = tryCatchWrapper<Request>(
  async (req: Request, res: Response) => {
    const { username, firstName, lastName, password, email } = req.body;
    const validation = registerUserInputSchema.safeParse({
      username,
      firstName,
      lastName,
      password,
      email,
    });

    //TODO: 2. Get avatar image from req.file using multer

    if (!validation.success) {
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

    const mailResponse = await sendMail(newUser, "VERIFY");
    if (!mailResponse?.response) {
      return res
        .status(500)
        .json(
          new CustomError(
            500,
            "Error Occurred while  Sending Mail! To Verify user Email!"
          )
        );
    }

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

    const validation = loginUserInputSchema.safeParse({
      username,
      email,
      password,
    });

    if (!validation.success) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Correct User fields!"));
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
      if (!mailResponse?.response) {
        return res
          .status(500)
          .json(
            new CustomError(
              500,
              "Error Occurred while  Sending Mail! To Verify user Email!"
            )
          );
      }
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
    await existingUser.save({ validateBeforeSave: false });

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

export const verifyEmailHandler = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { verificationCode } = req.body;
    const validation = verifyEmailInputSchema.safeParse({ verificationCode });
    if (!validation.success) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Correct Verify Email Fields!"));
    }
    const isVerified = await verifyEmail(verificationCode);
    console.log(isVerified);
    if (isVerified) {
      return res
        .status(200)
        .json(new CustomApiResponse(200, {}, "Email Verified Successfully!"));
    }
    //isVerified is false it means either verification code is wrong or user has exceeded verification code expiry
    //In this case again send verification code
    const mailResponse = await sendMail(req.user!, "VERIFY");
    if (!mailResponse?.response) {
      return res
        .status(500)
        .json(
          new CustomError(
            500,
            "Error Occurred while Again Sending Mail! to verify Email!"
          )
        );
    }
    return res
      .status(400)
      .json(new CustomError(400, "Invalid Verification Code Send! Retry!"));
  }
);

//TODO: Edge Case Test try to hit this end point and other endpoints with google login and see what happens

//TODO: Add Rate limit to end points especially to those which send email!
export const forgotPasswordHandler = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { username, email } = req.body;
    const validation = forgotPasswordInputSchema.safeParse({ username, email });
    if (!validation.success) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Correct Forgot Password Fields!"));
    }
    // 1. find if user exists with username or email
    const user = await User.findOne({
      $and: [{ username }, { email }],
    });
    if (!user) {
      return res.status(400).json("Invalid username or email!");
    }
    //2. send verification token on user's email
    const mailResponse = await sendMail(user, "RESET");
    console.log(mailResponse);
    if (!mailResponse?.response) {
      return res
        .status(500)
        .json(
          new CustomError(500, "Error While Sending Email To Reset Password!")
        );
    }
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          {},
          "Mail to Reset Password Sent Successfully!"
        )
      );
  }
);

export const resetPasswordHandler = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { oldPassword, newPassword, verificationCode } = req.body;
    const validation = resetPasswordInputSchema.safeParse({
      oldPassword,
      newPassword,
      verificationCode,
    });
    if (!validation.success) {
      return res
        .status(400)
        .json(new CustomError(400, "Send Correct Reset Password Fields!"));
    }
    //1. check if password sent is correct.
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json(new CustomError(404, "User Doesn't Exist!"));
    }
    const isValidPassword = await user?.isPasswordCorrect(oldPassword);
    if (!isValidPassword) {
      return res.status(400).json(new CustomError(400, "Invalid Password"));
    }
    //2. reset password
    const isPasswordReset = await resetPassword(newPassword, verificationCode);
    if (!isPasswordReset) {
      // it means verification code sent is incorrect, send another for retry.
      //TODO: Add rate limit
      const mailResponse = await sendMail(user, "RESET");
      if (!mailResponse?.response) {
        return res
          .status(500)
          .json(
            new CustomError(
              500,
              "Error Occurred while Again Sending Mail! to reset password"
            )
          );
      }
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
      const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            refreshToken: "", //mongoose does not let us store undefined, so instead do ""
          },
        },
        { new: true }
      );
      console.log(updatedUser);
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
      user.refreshToken = refreshToken;
      await user.save({ validateModifiedOnly: true });
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
