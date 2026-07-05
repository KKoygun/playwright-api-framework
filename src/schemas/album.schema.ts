import { z } from 'zod';

export const AlbumSchema = z.object({
  userId: z.number(),
  id:     z.number(),
  title:  z.string().min(1),
});

export const AlbumListSchema = z.array(AlbumSchema);

/**
 * PhotoSchema validates the nested /albums/:id/photos resource.
 *
 * url and thumbnailUrl are validated as proper URLs — a real API returning
 * relative paths or malformed links would fail here immediately.
 */
export const PhotoSchema = z.object({
  albumId:      z.number(),
  id:           z.number(),
  title:        z.string().min(1),
  url:          z.string().url(),
  thumbnailUrl: z.string().url(),
});

export const PhotoListSchema = z.array(PhotoSchema);

export type Album     = z.infer<typeof AlbumSchema>;
export type AlbumList = z.infer<typeof AlbumListSchema>;
export type Photo     = z.infer<typeof PhotoSchema>;
export type PhotoList = z.infer<typeof PhotoListSchema>;
