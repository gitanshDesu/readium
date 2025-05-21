import { z } from "zod/v4";

export const loginUserInputSchema = z.object({
  username: z
    .string("Username is required")
    .max(50, "You can use upto 50 characters for a username")
    .trim()
    .toLowerCase(),
  email: z.email("Email is required!").trim(),
  password: z
    .string()
    .trim()
    .min(6, "Password should be at least 6 characters long!")
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])((?=.*\W)|(?=.*_))^[^ ]+$/),
});

export type loginUserInputTypes = z.infer<typeof loginUserInputSchema>;
