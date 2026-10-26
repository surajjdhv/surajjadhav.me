// These Giscus identifiers are public embed settings, never GitHub access tokens.
export const githubUsername = "surajjdhv";
export const giscus = {
  repo: import.meta.env.PUBLIC_GISCUS_REPO ?? "",
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID ?? "",
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY ?? "Announcements",
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID ?? "",
};
export const giscusEnabled = Boolean(
  giscus.repo && giscus.repoId && giscus.categoryId
);
