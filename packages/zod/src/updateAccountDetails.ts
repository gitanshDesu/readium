import z from "zod/v4";

export const updateAccountDetailsInputSchema = z.object({
  NewFirstName: z
    .string()
    .max(50, "You can use upto 50 characters for a first name")
    .trim()
    .toLowerCase(),
  NewLastName: z
    .string()
    .max(50, "You can use upto 50 characters for a last name")
    .trim()
    .toLowerCase(),
  NewUsername: z
    .string()
    .max(50, "You can use upto 50 characters for a username")
    .trim()
    .toLowerCase()
    .optional(),
  OldUsername: z
    .string()
    .max(50, "You can use upto 50 characters for a username")
    .trim()
    .toLowerCase(),
});

export type UpdateAccountInputType = z.infer<
  typeof updateAccountDetailsInputSchema
>;
