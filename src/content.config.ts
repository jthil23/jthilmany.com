import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
  }),
});

const guide = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().int().positive(),
    updated: z.coerce.date().optional(),
  }),
});

// Work case studies. Screenshots use demo or synthetic data only; see the work-intake repo for provenance.
const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    summary: z.string(),
    kind: z.string(),
    period: z.string(),
    role: z.string(),
    stack: z.array(z.string()),
    order: z.number().int().positive(),
    facts: z.array(z.object({ value: z.string(), label: z.string() })).max(4),
    flow: z.array(z.object({ label: z.string(), note: z.string().optional() })).min(2),
    images: z.array(z.object({ src: image(), alt: z.string(), caption: z.string() })).default([]),
  }),
});

export const collections = { notes, guide, work };
