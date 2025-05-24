import { User } from "@readium/database/user.model";
import { Profile } from "passport";
import { VerifyCallback } from "passport-google-oidc";

export const googleVerifyHelper = async (
  issuer: string,
  profile: Profile,
  cb: VerifyCallback
) => {
  try {
    const existingUser = await User.findOne({
      $and: [{ googleId: profile.id }, { provider: profile.provider }],
    });
    if (existingUser) {
      return cb(null, existingUser);
    }
    // create new user using User.create
    console.log(profile);
    const newUser = await User.create({
      provider: profile.provider,
      googleId: profile.id,
      username: profile.username,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      email: profile.emails![0]?.value,
      avatar: profile.photos![0]?.value,
      isVerified: true,
      password: undefined,
    });
    return cb(null, newUser);
  } catch (error) {
    console.log(
      `${error} : Error Occurred in verify function of passport's google strategy`
    );
  }
};
