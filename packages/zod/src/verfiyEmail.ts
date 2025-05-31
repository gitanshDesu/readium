import { z } from "zod/v4";

export const verifyEmailInputSchema = z.object({
  verificationCode: z.string("Verification Code is Required!").trim(),
});

export type verifyEmailInputTypes = z.infer<typeof verifyEmailInputSchema>;
