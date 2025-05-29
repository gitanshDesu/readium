/*
 Verifies user's email using verification code 
 @param user: UserDocumentType
 @param verification code : string

 function will set isVerified to true if user's verification code matches with verification code saved in DB && code has not expired by that time.

 returns isVerified : boolean (but this utility will be async)

*/

import { User, UserDocumentType } from "@readium/database/user.model";

export const verifyEmail = async (
  user: UserDocumentType,
  verificationCode: string
): Promise<boolean | undefined> => {
  try {
    const validUser = await User.findOne({
      $and: [
        { verificationCode },
        {
          verificationExpiry: { $gt: user.verificationExpiry },
        },
      ],
    });
    if (validUser) {
      validUser.isVerified = true;
      validUser.verificationCode = undefined;
      validUser.verificationExpiry = undefined;
      await validUser.save({ validateBeforeSave: false });
      return validUser.isVerified;
    }
    return false;
  } catch (error) {
    console.log("Error Occurred while verifying Email: \n ", error);
  }
};
