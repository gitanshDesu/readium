import { z } from "zod/v4";

export const getAllSuchBlogsInputSchema = z.object({
  query: z
    .string()
    .max(200, "Can send at max 2000 characters!")
    .optional()
    .default(""),
  page: z
    .string()
    .regex(/^\d+$/, "Must contain only digits")
    .optional()
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Must contain only digits")
    .optional()
    .default("10"),
  sortBy: z.enum(["createAt"]).optional().default("createAt"), //TODO: Add for views,likes etc.
  sortType: z
    .string()
    .regex(/^\d+$/, "Must contain only digits")
    .optional()
    .default("1"),
  filter: z.array(z.string()).max(10).optional().default([]),
});

export type GetAllSuchBlogsInputType = z.infer<
  typeof getAllSuchBlogsInputSchema
>;
