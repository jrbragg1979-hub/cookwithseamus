import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Seamus'),
    heroEmoji: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    heroImageCredit: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
