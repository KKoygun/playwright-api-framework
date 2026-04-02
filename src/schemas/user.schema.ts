import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string(),
  suite: z.string(),
  city: z.string(),
  zipcode: z.string(),
});

export const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  address: AddressSchema,
  phone: z.string(),
  website: z.string(),
});

export const UserListSchema = z.array(UserSchema);

export type User = z.infer<typeof UserSchema>;
