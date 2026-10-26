import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";
import { series } from "@/data/series";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        pubDatetime: z.date(),
        modDatetime: z.date().optional().nullable(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        tags: z.array(z.string()).default(["others"]),
        ogImage: image().or(z.string()).optional(),
        description: z.string(),
        category: z.enum(["Learning", "Building", "Thoughts"]),
        series: z.string().optional(),
        seriesDay: z.number().int().positive().optional(),
        starter: z.boolean().default(false),
        commentId: z.string().optional(),
        canonicalURL: z.string().optional(),
        hideEditPost: z.boolean().optional(),
        timezone: z.string().optional(),
      })
      .superRefine((post, ctx) => {
        if (Boolean(post.series) !== Boolean(post.seriesDay)) {
          ctx.addIssue({
            code: "custom",
            message: "Provide both series and seriesDay, or neither.",
          });
        }
        if (post.series) {
          const definition = series.find(item => item.slug === post.series);
          if (!definition)
            ctx.addIssue({
              code: "custom",
              message: `Unknown series: ${post.series}`,
            });
          else if (post.seriesDay! > definition.target)
            ctx.addIssue({
              code: "custom",
              message: `seriesDay must be at most ${definition.target}.`,
            });
        }
      }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

export const collections = { posts, pages };
