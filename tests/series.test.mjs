import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  cpSync,
  symlinkSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Build fixtures in a separate checkout. The authored site and its preview
// never contain test posts or test Giscus identifiers.
test(
  "series order, progress, comments configuration, and scheduled-post privacy",
  { timeout: 120000 },
  () => {
    const project = resolve(".");
    const directory = mkdtempSync(join(tmpdir(), "suraj-series-test-"));
    const runBuild = () =>
      spawnSync(
        process.execPath,
        [join(project, "node_modules/astro/bin/astro.mjs"), "build"],
        {
          cwd: directory,
          env: {
            ...process.env,
            PUBLIC_GISCUS_REPO: "example/comments",
            PUBLIC_GISCUS_REPO_ID: "test-repo-id",
            PUBLIC_GISCUS_CATEGORY: "Announcements",
            PUBLIC_GISCUS_CATEGORY_ID: "test-category-id",
          },
          encoding: "utf8",
          timeout: 60000,
        }
      );
    const fixture = (day, date) =>
      `---\ntitle: "QA day ${day}"\ndescription: "Isolated integration test fixture"\npubDatetime: ${date}\ncategory: Learning\ntags: [ai]\nseries: 100-days-of-learning-ai\nseriesDay: ${day}\n---\n\nA test learning note.\n`;
    try {
      for (const path of [
        "src",
        "public",
        "package.json",
        "astro.config.ts",
        "astro-paper.config.ts",
        "tsconfig.json",
      ]) {
        cpSync(join(project, path), join(directory, path), {
          recursive: true,
          filter: path => !path.includes("/public/pagefind"),
        });
      }
      symlinkSync(
        join(project, "node_modules"),
        join(directory, "node_modules"),
        "dir"
      );
      const astroConfigPath = join(directory, "astro.config.ts");
      writeFileSync(
        astroConfigPath,
        readFileSync(astroConfigPath, "utf8").replace(
          "vite: {",
          "vite: { resolve: { preserveSymlinks: true },"
        )
      );
      // Reversed publication dates prove that series order follows day numbers.
      writeFileSync(
        join(directory, "src/content/posts/qa-day-1.md"),
        fixture(1, "2020-01-01T00:00:00Z").replace(
          "seriesDay: 1\n",
          "seriesDay: 1\ndraft: true\n"
        )
      );
      writeFileSync(
        join(directory, "src/content/posts/qa-day-2.md"),
        fixture(2, "2020-02-02T00:00:00Z")
      );
      writeFileSync(
        join(directory, "src/content/posts/qa-day-3.md"),
        fixture(3, "2020-01-01T00:00:00Z")
      );
      writeFileSync(
        join(directory, "src/content/posts/qa-day-4.md"),
        fixture(4, "2099-01-01T00:00:00Z")
      );
      const built = runBuild();
      assert.equal(built.status, 0, built.stdout + built.stderr);
      const read = path => readFileSync(join(directory, "dist", path), "utf8");
      const series = read("series/100-days-of-learning-ai/index.html");
      assert.match(series, /value="2" max="100"/);
      assert.ok(
        series.indexOf("QA day 2") < series.indexOf("QA day 3"),
        "series is in day order"
      );
      assert.equal((series.match(/class="completed-day"/g) ?? []).length, 2);
      const second = read("posts/qa-day-2/index.html");
      const third = read("posts/qa-day-3/index.html");
      assert.match(second, /href="\/posts\/qa-day-3\/"/);
      assert.match(third, /href="\/posts\/qa-day-2\/"/);
      assert.match(
        second,
        /<giscus-comments[^>]+data-repo="example\/comments"/
      );
      assert.match(second, /data-term="qa-day-2"/);
      assert.doesNotMatch(second, /Comments are on their way/);
      assert.equal(
        existsSync(join(directory, "dist/posts/qa-day-4")),
        false,
        "future page and social image are both excluded"
      );
      assert.equal(
        existsSync(join(directory, "dist/posts/qa-day-1")),
        false,
        "draft page and social image are both excluded"
      );
      assert.doesNotMatch(read("rss.xml"), /qa-day-4|qa-day-1/);
      assert.doesNotMatch(read("sitemap-0.xml"), /qa-day-4|qa-day-1/);

      writeFileSync(
        join(directory, "src/content/posts/qa-duplicate.md"),
        fixture(2, "2020-01-01T00:00:00Z")
      );
      const duplicate = runBuild();
      assert.notEqual(
        duplicate.status,
        0,
        "duplicate days must fail the build"
      );
      assert.match(duplicate.stdout + duplicate.stderr, /Duplicate day 2/);
      rmSync(join(directory, "src/content/posts/qa-duplicate.md"));

      writeFileSync(
        join(directory, "src/content/posts/qa-invalid.md"),
        fixture(101, "2020-01-01T00:00:00Z")
      );
      const invalid = runBuild();
      assert.notEqual(
        invalid.status,
        0,
        "out-of-range days must fail the build"
      );
      assert.match(
        invalid.stdout + invalid.stderr,
        /seriesDay must be at most 100/
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
);
