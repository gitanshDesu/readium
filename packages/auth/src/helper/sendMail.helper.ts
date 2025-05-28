import { UserDocumentType } from "@readium/database/user.model";
import nodemailer from "nodemailer";
import { verificationCodeGenerator } from "./generateVerificationCode.helper";

type mailType = "VERIFY" | "RESET";

const verificationCode: string = verificationCodeGenerator(10, {
  digits: true,
  alphabets: true,
  specialChars: false,
});

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
    const HTMLBody: string = `
        <p> 
        Enter this verification Code to ${mailType === "VERIFY" ? "Verify your Email" : "Reset Your Password"}
        <br>
        <bold> Verification Code </bold> : ${verificationCode}
        <br>
        <bold><em> This code will expire in 1 hour! </em></bold>
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
