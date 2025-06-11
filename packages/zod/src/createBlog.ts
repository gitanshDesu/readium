import { z } from "zod/v4";

export const createBlogInputSchema = z.object({
  title: z.string("title field is missing!"),
  content: z.string("content field is missing!"),
  tags: z.array(z.string()).max(10, "Atmost 10 tags are allowed!").optional(),
});

export type CreateBlogInputType = z.infer<typeof createBlogInputSchema>;
