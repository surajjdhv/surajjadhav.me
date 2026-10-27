import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const root = resolve("dist");
assert.ok(
  existsSync(join(root, "index.html")),
  "Run npm run build before npm test."
);
const read = path => readFileSync(join(root, path), "utf8");
const introSlug = "a-decade-in-tech-learning-ai";
const introTitle = "After a decade in tech, I’m going deeper into AI";
function walk(directory) {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
const htmlFiles = walk(root).filter(path => path.endsWith(".html"));

test("site arrows use SVGs and the footer links its four scores to the public report", () => {
  for (const path of htmlFiles) {
    const html = readFileSync(path, "utf8");
    assert.doesNotMatch(html, /[↗→←↑↳]/, relative(root, path));
    assert.match(html, /class="arrow-icon"/);
    assert.match(html, /href="\/lighthouse\/"/);
    const footer = html.slice(html.indexOf("<footer"));
    assert.match(footer, /<strong>4 × 100<\/strong>/);
  }
});

test("every emitted page has a main landmark, one heading, and canonical metadata", () => {
  for (const path of htmlFiles) {
    const html = readFileSync(path, "utf8");
    const label = relative(root, path);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${label}: one h1`);
    assert.match(html, /id="main-content"/, `${label}: main landmark`);
    assert.match(
      html,
      /<link rel="canonical" href="https:\/\/surajjadhav\.me\//,
      `${label}: canonical domain`
    );
    assert.match(
      html,
      /<meta name="description" content="[^" ]/,
      `${label}: description`
    );
  }
});

test("internal links and social image URLs resolve to generated files", () => {
  const missing = [];
  for (const path of htmlFiles) {
    const html = readFileSync(path, "utf8");
    const links = [...html.matchAll(/(?:href|src)="([^"\s]+)"/g)].map(
      match => match[1]
    );
    links.push(
      ...[...html.matchAll(/property="og:image" content="([^"]+)"/g)].map(
        match => match[1]
      )
    );
    for (const link of links) {
      if (/^(mailto:|tel:|data:|javascript:|#)/.test(link)) continue;
      const url = new URL(
        link.replaceAll("&amp;", "&"),
        `https://surajjadhav.me/${relative(root, path)}`
      );
      if (url.hostname !== "surajjadhav.me") continue;
      const target = join(root, decodeURIComponent(url.pathname));
      const candidates = [target, `${target}.html`, join(target, "index.html")];
      if (
        !candidates.some(
          candidate => existsSync(candidate) && statSync(candidate).isFile()
        )
      )
        missing.push(`${relative(root, path)} → ${url.pathname}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("the AI series begins at zero and renders all 100 uncompleted days", () => {
  const html = read("series/100-days-of-learning-ai/index.html");
  assert.match(html, /value="0" max="100"/);
  assert.equal((html.match(/not published yet/g) ?? []).length, 200); // title + accessible label
  assert.doesNotMatch(html, /class="completed-day"/);
  assert.match(html, /The first learning note is still to come/);
});

test("removed posts and drafts have no generated routes, images, feeds, or listings", () => {
  for (const slug of [
    "a-small-place-to-think",
    "a-home-for-my-notes",
    "100-days-one-thing-at-a-time",
    "learning-ai/day-001",
  ]) {
    assert.equal(existsSync(join(root, `posts/${slug}`)), false);
  }
  for (const path of htmlFiles)
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /a-small-place-to-think|a-home-for-my-notes|100-days-one-thing-at-a-time|day-001/,
      relative(root, path)
    );
  for (const file of ["rss.xml", "sitemap-0.xml"])
    assert.doesNotMatch(
      read(file),
      /a-small-place-to-think|a-home-for-my-notes|100-days-one-thing-at-a-time|day-001/
    );
});

test("the introduction is grouped under Learning and AI, with honest empty categories", () => {
  assert.ok(read("categories/learning/index.html").includes(introTitle));
  assert.ok(read("tags/ai/index.html").includes(introTitle));
  assert.ok(
    read("tags/100-days-of-learning-ai/index.html").includes(introTitle)
  );
  for (const category of ["building", "thoughts"]) {
    assert.match(
      read(`categories/${category}/index.html`),
      /Nothing here just yet/
    );
    assert.ok(!read(`categories/${category}/index.html`).includes(introTitle));
  }
});

test("RSS contains only the new introduction with the correct domain link", () => {
  const xml = read("rss.xml");
  assert.equal((xml.match(/<item>/g) ?? []).length, 1);
  assert.ok(xml.includes(`https://surajjadhav.me/posts/${introSlug}/`));
  assert.match(xml, /#100DaysOfLearningAI/);
});

test("the introduction has comments and a social image without a starter label", () => {
  const html = read(`posts/${introSlug}/index.html`);
  assert.doesNotMatch(html, /This is a starter post/);
  assert.match(html, /I don’t have a degree/);
  assert.match(html, /my maths foundations need work/);
  assert.match(html, /id="comments"/);
  assert.match(html, /Comments are on their way/);
  const png = readFileSync(join(root, `posts/${introSlug}/index.png`));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
});

test("only published post bodies are marked for the Pagefind search index", () => {
  const indexed = htmlFiles.filter(path =>
    readFileSync(path, "utf8").includes("data-pagefind-body")
  );
  assert.equal(indexed.length, 1);
  assert.equal(
    readdirSync(join(root, "pagefind/fragment")).length,
    1,
    "no stale fragments from deleted posts"
  );
  assert.ok(existsSync(join(root, "pagefind/pagefind.js")));
});

test("GitHub chart uses the supplied username and has a no-JavaScript fallback", () => {
  const html = read("index.html");
  assert.match(html, /data-username="surajjdhv"/);
  assert.match(html, /<noscript><a[^>]+github.com\/surajjdhv/);
  assert.doesNotMatch(html, /\d+ contributions in the last year/); // never fabricate static activity
});
