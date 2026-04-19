import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    target_repo: z.string(),
    category: z.string(),
    description: z.string(),
    cover: z.string().optional(),
    cover_tag: z.string().optional(),
  }),
});

export const collections = { blog };
