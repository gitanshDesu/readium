import { z } from "zod/v4";

export const resetPasswordInputSchema = z.object({
  oldPassword: z
    .string("Old Password is Required!")
    .trim()
    .min(6, "Password should be at least 6 characters long!")
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])((?=.*\W)|(?=.*_))^[^ ]+$/),
  newPassword: z
    .string("New Password is Required!")
    .trim()
    .min(6, "Password should be at least 6 characters long!")
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])((?=.*\W)|(?=.*_))^[^ ]+$/),
  verificationCode: z.string("Verification Code is Required!").trim(),
});

export type resetPasswordInputTypes = z.infer<typeof resetPasswordInputSchema>;
