import { z } from "zod/v4";

export const updateBlogInputSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});

export type UpdateBlogInputType = z.infer<typeof updateBlogInputSchema>;
