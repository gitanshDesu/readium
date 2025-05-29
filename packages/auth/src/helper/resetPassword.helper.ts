import { User, UserDocumentType } from "@readium/database/user.model";

export const resetPassword = async (
  user: UserDocumentType,
  newPassword: string,
  verificationCode: string
): Promise<boolean | undefined> => {
  try {
    //1. verify verification code
    const validUser = await User.findOne({
      $and: [
        { verificationCode },
        { verificationExpiry: { $gt: user.verificationExpiry } },
      ],
    });
    if (!validUser) {
      // it means verification code sent is invalid return false
      return false;
    }
    validUser.password = newPassword;
    validUser.verificationCode = undefined;
    validUser.verificationExpiry = undefined;
    await validUser.save({ validateBeforeSave: false });
    console.log(validUser.isPasswordCorrect(newPassword));
    return true;
  } catch (error) {
    console.log("Error Occurred while reseting password: ", error);
  }
};
