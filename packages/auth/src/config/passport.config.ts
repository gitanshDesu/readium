import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import { googleVerifyHelper } from "../helper/passport.helper";
import { User } from "@readium/database/user.model";
import dotenv from "dotenv";
import path from "path";

//load env variables using dotenv, else we will get error because w/o dotenv these env variables won't load
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["openid", "profile", "email"],
      passReqToCallback: false,
    },
    googleVerifyHelper
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser(async (_id, cb) => {
  const user = await User.findById(_id);
  cb(null, user);
});

export default passport;
