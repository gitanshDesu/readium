import { User, UserDocumentType } from "@readium/database/user.model";
import nodemailer from "nodemailer";
import { verificationCodeGenerator } from "./generateVerificationCode.helper";

type mailType = "VERIFY" | "RESET";

const verificationCode: string = verificationCodeGenerator(10, {
  digits: true,
  alphabets: true,
  specialChars: false,
});

//Persist this verification code with in User DB and create verification code expiry (persist this as well)

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASS,
  },
});

export const sendMail = async (user: UserDocumentType, mailType: mailType) => {
  try {
    //Persist verification code in DB along with verificationCode expiry.
    //TODO: Hash verification code
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          verificationCode: verificationCode,
          verificationExpiry: Date.now() * 60 * 60 * 1000,
        },
      },
      { new: true }
    );

    const HTMLBody: string = `
        <p> 
        Enter this verification Code to ${mailType === "VERIFY" ? "Verify your Email" : "Reset Your Password"}
        <br>
        <strong> Verification Code </strong> : ${verificationCode}
        <br>
        <strong><em> This code will expire in 1 hour! </em></strong>
        </p>
        `;

    const mailResponse = await transporter.sendMail({
      from: `"Readium" <${process.env.ETHEREAL_USER}>`,
      to: `${user.email}`,
      subject: mailType === "VERIFY" ? "Verify Email" : "Reset Password",
      html: HTMLBody,
    });

    return mailResponse;
  } catch (error: unknown) {
    console.log("Error Occurred while sending Email: ", error);
  }
};
