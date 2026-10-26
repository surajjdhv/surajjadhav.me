import type { CollectionEntry } from "astro:content";
import { series } from "@/data/series";
import { getSortedPosts } from "./getSortedPosts";

export function getSeriesPosts(
  posts: CollectionEntry<"posts">[],
  slug: string
) {
  // Validate all entries, including drafts, so accidental duplicate day numbers
  // are caught before a draft is published.
  const days = new Set<number>();
  for (const post of posts.filter(post => post.data.series === slug)) {
    const day = post.data.seriesDay!;
    if (days.has(day))
      throw new Error(`Duplicate day ${day} in series ${slug}`);
    days.add(day);
  }
  return getSortedPosts(posts)
    .filter(post => post.data.series === slug)
    .sort((a, b) => a.data.seriesDay! - b.data.seriesDay!);
}

export function getSeries(slug: string) {
  return series.find(item => item.slug === slug);
}
