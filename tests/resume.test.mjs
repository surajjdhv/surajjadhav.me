import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const files = directory =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

test("the public resume omits contact details and does not bundle the source PDF", () => {
  const html = readFileSync("dist/resume/index.html", "utf8");
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
  assert.match(text, /Experience highlights/);
  assert.match(text, /Tools I work with/);
  assert.doesNotMatch(text, /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(text, /(?:\+\d{1,3}[\s-]?)?(?:\d[\s()-]?){10,}/);
  assert.doesNotMatch(html, /mailto:|tel:|\.pdf(?:["?#])|\/Users\//i);
  assert.equal(
    [...files("public"), ...files("dist")].some(path => /\.pdf$/i.test(path)),
    false
  );
  assert.match(
    readFileSync("dist/about/index.html", "utf8"),
    /href="\/resume\/"/
  );
});
