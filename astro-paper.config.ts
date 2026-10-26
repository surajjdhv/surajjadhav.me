import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://surajjadhav.me/",
    title: "Suraj Jadhav",
    description:
      "Thoughts, things I'm building, and notes from learning in public. A personal corner of the internet by Suraj Jadhav.",
    author: "Suraj Jadhav",
    profile: "https://github.com/surajjdhv",
    lang: "en",
    timezone: "Asia/Kolkata",
    dir: "ltr",
  },
  posts: { perPage: 8, perIndex: 4, scheduledPostMargin: 0 },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: { enabled: false },
    search: "pagefind",
  },
  socials: [{ name: "github", url: "https://github.com/surajjdhv" }],
  shareLinks: [],
});
