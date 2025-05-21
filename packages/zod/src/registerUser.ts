import { z } from "zod/v4";

export const registerUserInputSchema = z.object({
  username: z
    .string("Username is required")
    .max(50, "You can use upto 50 characters for a username")
    .trim()
    .toLowerCase(),
  firstName: z
    .string("First Name is required!")
    .max(50, "You can use upto 50 characters for first name!")
    .trim(),
  lastName: z
    .string()
    .trim()
    .max(50, "You can use upto 50 characters for last name!")
    .optional(),
  email: z.email("Email is required!").trim(),
  password: z
    .string()
    .trim()
    .min(6, "Password should be at least 6 characters long!")
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])((?=.*\W)|(?=.*_))^[^ ]+$/),
});

export type registerUserInputTypes = z.infer<typeof registerUserInputSchema>;
