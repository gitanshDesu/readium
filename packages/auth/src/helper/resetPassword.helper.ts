import { User } from "@readium/database/user.model";

export const resetPassword = async (
  newPassword: string,
  verificationCode: string
): Promise<boolean | undefined> => {
  try {
    //1. verify verification code
    const validUser = await User.findOne({
      $and: [{ verificationCode }, { verificationExpiry: { $gt: Date.now() } }],
    });
    if (!validUser) {
      // it means verification code sent is invalid return false
      return false;
    }
    validUser.password = newPassword;
    validUser.verificationCode = undefined;
    validUser.verificationExpiry = undefined;
    await validUser.save(); // validateBeforeSave:false option let us pass mongoose validation and let us directly save in DB but doing this here in this case would cause an error, because in mongoose doing doc.path = undefined holds a special meaning i.e. this expression instructs mongoose to remove the `path`,but passing validation would mean that this expression is trying to save undefined at this field in DB which Mongo doesn't allow us to save.
    console.log(validUser.isPasswordCorrect(newPassword));
    return true;
  } catch (error) {
    console.log("Error Occurred while reseting password: ", error);
  }
};
