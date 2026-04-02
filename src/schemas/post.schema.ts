import { z } from 'zod';

/**
 * Zod schemas for the Post resource.
 *
 * Defining the contract here means any response shape change (field renamed,
 * type changed, field dropped) fails the test immediately — not silently in
 * a downstream assertion. This is lightweight contract testing without Pact.
 */
export const PostSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const PostListSchema = z.array(PostSchema);

export const CreatedPostSchema = PostSchema.extend({
  id: z.number().positive(),
});

export type Post = z.infer<typeof PostSchema>;
export type PostList = z.infer<typeof PostListSchema>;
