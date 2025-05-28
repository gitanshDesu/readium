import { CustomError } from "@readium/utils/customError";
import * as crypto from "crypto";

const digits = "23456789"; // avoid numbers 0,1 which can be misread.

// we will be only use alphabets in lowercase (avoid using both lowercase and uppercase)
const alphabets = "abcdefghijklmnpqrst"; // avoid o which can be misread

const specialChars = "#!&@";

export interface GenerateCodeOptions {
  digits?: boolean;
  alphabets?: boolean;
  specialChars?: boolean;
}

//Generate verification code based on length (default set to 8)

export const verificationCodeGenerator = (
  length: number = 8,
  options: GenerateCodeOptions
): string => {
  const {
    digits: includeDigits = true,
    alphabets: includeAlphabets = true,
    specialChars: includeSpecialChars = true,
  } = options;
  const allowedChars =
    (includeDigits ? digits : "") +
    (includeAlphabets ? alphabets : "") +
    (includeSpecialChars ? specialChars : "");
  if (!allowedChars) {
    throw new Error(
      "No Characters available to generate verification code. Please adujst the options!"
    );
  }
  let verificationCode = "";
  while (verificationCode.length < length) {
    const charIndex = crypto.randomInt(0, allowedChars.length);
    verificationCode += allowedChars[charIndex];
  }
  return verificationCode;
};
