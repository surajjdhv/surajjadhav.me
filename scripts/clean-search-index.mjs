import { rm } from "node:fs/promises";

// The development index is copied from dist after each build. Remove the old
// copy first so deleted posts cannot survive in stale Pagefind fragments.
await rm(new URL("../public/pagefind/", import.meta.url), {
  recursive: true,
  force: true,
});
