import { z } from "zod/v4";

export const createBlogBodySchema = z.object({
  title: z.string("title field is missing!"),
  content: z.string("content field is missing!"),
});

export const createBlogQuerySchema = z.object({
  tags: z.array(z.string()).max(10, "Atmost 10 tags are allowed!").optional(),
});

export type CreateBlogBodyType = z.infer<typeof createBlogBodySchema>;
export type CreateBlogQueryType = z.infer<typeof createBlogQuerySchema>;
