// These Giscus identifiers are public embed settings, never GitHub access tokens.
export const githubUsername = "surajjdhv";
const configuredGiscus = {
  repo: import.meta.env.PUBLIC_GISCUS_REPO?.trim() ?? "",
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID?.trim() ?? "",
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY?.trim() || "Announcements",
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID?.trim() ?? "",
};
const hasCustomRepository = Boolean(
  configuredGiscus.repo ||
  configuredGiscus.repoId ||
  configuredGiscus.categoryId
);
// Keep this site's public identifiers together. Partial overrides must not mix
// a different repository with these repository/category IDs.
export const giscus = hasCustomRepository
  ? configuredGiscus
  : {
      repo: "surajjdhv/surajjadhav.me",
      repoId: "R_kgDOKn2RmQ",
      category: "Announcements",
      categoryId: "DIC_kwDOKn2Rmc4CayJ-",
    };
export const giscusEnabled = Boolean(
  giscus.repo && giscus.repoId && giscus.categoryId
);
