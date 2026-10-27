import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { summarizeSamples } from "../scripts/lighthouse-scores.mjs";
import { generateLighthouseReport } from "../scripts/generate-lighthouse-report.mjs";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "suraj-lighthouse-report-"));
  const inputRoot = join(root, "inputs");
  const siteDirectory = join(root, "site");
  const summaries = {};
  for (const factor of ["mobile", "desktop"]) {
    const directory = join(inputRoot, `lighthouse-${factor}`, factor);
    await mkdir(directory, { recursive: true });
    const results = [];
    for (const path of ["/", "/about/", "/lighthouse/"]) {
      const samples = [];
      for (let index = 1; index <= (path === "/" ? 3 : 1); index++) {
        const name = path === "/" ? `home--run-${index}` : path.slice(1, -1);
        const sample = {
          path,
          factor,
          version: "13.5.0",
          runtimeError: null,
          scores: {
            performance: path === "/" && index === 1 ? 98 : 100,
            accessibility: 100,
            "best-practices": 100,
            seo: 100,
          },
          report: `.lighthouse/${factor}/${name}.report.html`,
        };
        samples.push(sample);
        await writeFile(
          join(directory, `${name}.report.html`),
          "<!doctype html><title>Full audit</title>"
        );
      }
      results.push(summarizeSamples(samples));
    }
    summaries[factor] = {
      source: "local production build",
      testedAt: "2026-10-27T20:00:00Z",
      results,
    };
  }
  async function save() {
    for (const factor of ["mobile", "desktop"])
      await writeFile(
        join(inputRoot, `lighthouse-${factor}`, "summary.json"),
        JSON.stringify(summaries[factor])
      );
  }
  await save();
  await mkdir(join(siteDirectory, "lighthouse"), { recursive: true });
  await writeFile(
    join(siteDirectory, "lighthouse/index.html"),
    "<main><!-- LIGHTHOUSE_REPORT_START -->Pending<!-- LIGHTHOUSE_REPORT_END --></main>"
  );
  return {
    root,
    inputRoot,
    siteDirectory,
    summaries,
    save,
    runId: "12345",
    revision: "abcdef1234567890",
  };
}

test("published report uses both devices, preserves all samples, and links to copied HTML", async () => {
  const setup = await fixture();
  try {
    const result = await generateLighthouseReport(setup);
    assert.equal(result.count, 4); // The report excludes its own placeholder audit.
    const html = await readFile(
      join(setup.siteDirectory, "lighthouse/index.html"),
      "utf8"
    );
    assert.match(html, /actions\/runs\/12345/);
    assert.match(html, /commit\/abcdef1234567890/);
    assert.match(html, /Mobile/);
    assert.match(html, /Desktop/);
    assert.match(html, /Run 1: 98/);
    assert.doesNotMatch(html, /Pending/);
    const data = JSON.parse(
      await readFile(
        join(setup.siteDirectory, "lighthouse/results.json"),
        "utf8"
      )
    );
    assert.equal(data.results.length, 4);
    for (const result of data.results) {
      assert.equal(result.scores.performance, 100);
      for (const sample of result.samples)
        await readFile(join(setup.siteDirectory, sample.href));
    }
  } finally {
    await rm(setup.root, { recursive: true, force: true });
  }
});

test("report publication rejects missing device coverage", async () => {
  const setup = await fixture();
  try {
    setup.summaries.desktop.results.pop();
    await setup.save();
    await assert.rejects(
      generateLighthouseReport(setup),
      /coverage does not match/
    );
  } finally {
    await rm(setup.root, { recursive: true, force: true });
  }
});

test("report publication rejects a failing result instead of displaying perfect circles", async () => {
  const setup = await fixture();
  try {
    setup.summaries.mobile.results[0].scores.seo = 99;
    await setup.save();
    await assert.rejects(
      generateLighthouseReport(setup),
      /Refusing to publish failing scores/
    );
  } finally {
    await rm(setup.root, { recursive: true, force: true });
  }
});

test("report publication checks reported scores against the samples", async () => {
  const setup = await fixture();
  try {
    setup.summaries.mobile.results[0].samples[1].scores.performance = 98;
    await setup.save();
    await assert.rejects(
      generateLighthouseReport(setup),
      /Summary scores do not match/
    );
  } finally {
    await rm(setup.root, { recursive: true, force: true });
  }
});
