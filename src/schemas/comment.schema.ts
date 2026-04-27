import { z } from 'zod';

/**
 * Zod schemas for the Comment resource.
 *
 * JSONPlaceholder /comments shape:
 *   { postId, id, name, email, body }
 *
 * The email field is validated as a proper email address — a real-world API
 * returning malformed emails would fail here immediately rather than silently.
 */
export const CommentSchema = z.object({
  postId: z.number(),
  id:     z.number(),
  name:   z.string().min(1),
  email:  z.string().email(),
  body:   z.string().min(1),
});

export const CommentListSchema = z.array(CommentSchema);

export type Comment     = z.infer<typeof CommentSchema>;
export type CommentList = z.infer<typeof CommentListSchema>;
