import { z } from 'zod';

/**
 * Zod schemas for the Todo resource.
 *
 * The `completed` boolean is the key field here — it enables filter-by-status
 * testing that isn't just a repeat of the Posts CRUD pattern.
 */
export const TodoSchema = z.object({
  userId:    z.number(),
  id:        z.number(),
  title:     z.string().min(1),
  completed: z.boolean(),
});

export const TodoListSchema = z.array(TodoSchema);

export type Todo     = z.infer<typeof TodoSchema>;
export type TodoList = z.infer<typeof TodoListSchema>;
