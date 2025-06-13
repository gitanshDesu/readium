import z from "zod/v4";

export const updateAccountDetailsInputSchema = z.object({
  newFirstName: z
    .string()
    .max(50, "You can use upto 50 characters for a first name")
    .trim()
    .toLowerCase(),
  newLastName: z
    .string()
    .max(50, "You can use upto 50 characters for a last name")
    .trim()
    .toLowerCase()
    .optional(),
  newUserName: z
    .string()
    .max(50, "You can use upto 50 characters for a username")
    .trim()
    .toLowerCase()
    .optional(),
  oldUserName: z
    .string()
    .max(50, "You can use upto 50 characters for a username")
    .trim()
    .toLowerCase(),
});

export type UpdateAccountInputType = z.infer<
  typeof updateAccountDetailsInputSchema
>;
