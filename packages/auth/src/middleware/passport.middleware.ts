import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import { googleVerifyHelper } from "../helper/passport.helper";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["openid", "profile", "email"],
    },
    googleVerifyHelper
  )
);
