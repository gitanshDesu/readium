import { z } from "zod/v4";

export const forgotPasswordInputSchema = z.object({
  username: z
    .string("Username is required")
    .max(50, "You can use upto 50 characters for a username")
    .trim()
    .toLowerCase(),
  email: z.email("Email is required!").trim(),
});

export type forgotPasswordTypes = z.infer<typeof forgotPasswordInputSchema>;
