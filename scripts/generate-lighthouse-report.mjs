import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { summarizeSamples } from "./lighthouse-scores.mjs";

const categories = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["best-practices", "Best Practices"],
  ["seo", "SEO"],
];
const marker =
  /<!-- LIGHTHOUSE_REPORT_START -->[\s\S]*?<!-- LIGHTHOUSE_REPORT_END -->/;
const escape = value =>
  String(value).replace(
    /[&<>"']/g,
    char =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]
  );

export async function generateLighthouseReport({
  inputRoot = ".lighthouse-input",
  siteDirectory = "dist",
  runId = process.env.GITHUB_RUN_ID,
  revision = process.env.GITHUB_SHA,
} = {}) {
  const groups = [];
  for (const factor of ["mobile", "desktop"]) {
    const directory = join(inputRoot, `lighthouse-${factor}`);
    const summary = JSON.parse(
      await readFile(join(directory, "summary.json"), "utf8")
    );
    if (
      summary.source !== "local production build" ||
      !summary.results?.length ||
      !Number.isFinite(Date.parse(summary.testedAt))
    )
      throw new Error(`Invalid ${factor} summary`);
    const seen = new Set();
    for (const result of summary.results) {
      if (
        result.factor !== factor ||
        !/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(result.path) ||
        seen.has(result.path)
      )
        throw new Error(`Invalid or duplicate ${factor} route`);
      seen.add(result.path);
      if (
        result.runtimeError ||
        categories.some(([key]) => result.scores?.[key] !== 100)
      )
        throw new Error(
          `Refusing to publish failing scores for ${factor} ${result.path}`
        );
    }
    groups.push({ factor, directory, summary, routes: [...seen].sort() });
  }
  if (JSON.stringify(groups[0].routes) !== JSON.stringify(groups[1].routes))
    throw new Error("Mobile and desktop route coverage does not match");

  const rows = [];
  const publicResults = [];
  const reportRoot = join(siteDirectory, "lighthouse");
  for (const path of groups[0].routes.filter(path => path !== "/lighthouse/")) {
    for (const { factor, directory, summary } of groups) {
      const result = summary.results.find(result => result.path === path);
      const samples = result.samples ?? [result];
      if (samples.length !== (path === "/" ? 3 : 1))
        throw new Error("Unexpected number of Lighthouse samples");
      const verified = summarizeSamples(samples);
      if (
        verified.runtimeError ||
        categories.some(([key]) => verified.scores[key] !== result.scores[key])
      )
        throw new Error("Summary scores do not match the raw samples");
      const sampleLinks = [];
      let representative;
      for (let index = 0; index < samples.length; index++) {
        const sample = samples[index];
        const name = basename(sample.report ?? "");
        if (!/^[a-zA-Z0-9-]+\.report\.html$/.test(name))
          throw new Error("Invalid raw report filename");
        if (
          sample.path !== path ||
          sample.factor !== factor ||
          sample.runtimeError ||
          categories.some(
            ([key]) =>
              !Number.isInteger(sample.scores?.[key]) ||
              sample.scores[key] < 0 ||
              sample.scores[key] > 100
          ) ||
          categories.some(
            ([key]) => key !== "performance" && sample.scores[key] !== 100
          )
        )
          throw new Error("Invalid or failing Lighthouse sample");
        const destination = join(reportRoot, "reports", factor);
        await mkdir(destination, { recursive: true });
        await copyFile(join(directory, factor, name), join(destination, name));
        const href = `/lighthouse/reports/${factor}/${name}`;
        if (sample.report === result.report) representative = href;
        sampleLinks.push({ href, performance: sample.scores.performance });
      }
      if (!representative)
        throw new Error("Representative report is missing from its samples");
      const device = factor === "mobile" ? "Mobile" : "Desktop";
      rows.push(
        `<tr><th scope="row"><a href="${escape(path)}">${escape(path === "/" ? "Home" : path)}</a></th><td>${device}</td>${categories.map(([key]) => `<td class="report-score">${result.scores[key]}</td>`).join("")}<td><a href="${escape(representative)}" aria-label="Full ${device.toLowerCase()} report for ${escape(path)}">Full report</a>${sampleLinks.length > 1 ? `<details class="report-samples"><summary>All ${sampleLinks.length} runs</summary>${sampleLinks.map((sample, index) => `<a href="${escape(sample.href)}">Run ${index + 1}: ${sample.performance}</a>`).join("")}</details>` : ""}</td></tr>`
      );
      publicResults.push({
        path,
        factor,
        scores: result.scores,
        version: result.version,
        report: representative,
        samples: sampleLinks,
      });
    }
  }
  if (!publicResults.length) throw new Error("No site routes to report");
  const scores = Object.fromEntries(
    categories.map(([key]) => [
      key,
      Math.min(...publicResults.map(result => result.scores[key])),
    ])
  );
  const testedAt = new Date(
    Math.max(...groups.map(group => Date.parse(group.summary.testedAt)))
  ).toISOString();
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(testedAt));
  const runUrl = /^\d+$/.test(runId ?? "")
    ? `https://github.com/surajjdhv/surajjadhav.me/actions/runs/${runId}`
    : "https://github.com/surajjdhv/surajjadhav.me/actions/workflows/lighthouse.yml";
  const revisionLink = /^[a-f0-9]{7,40}$/.test(revision ?? "")
    ? `<dt>Revision</dt><dd><a href="https://github.com/surajjdhv/surajjadhav.me/commit/${revision}">${revision.slice(0, 7)}</a></dd>`
    : "";
  const content = `<div class="report-metrics" aria-label="Lowest verified scores across the audited site pages">${categories.map(([key, label]) => `<div class="report-metric"><span class="lighthouse-circle" aria-label="${label}: ${scores[key]} out of 100">${scores[key]}</span><span>${label}</span></div>`).join("")}</div>
  <dl class="report-meta"><dt>Audited</dt><dd><time datetime="${testedAt}">${escape(date)} IST</time></dd><dt>Coverage</dt><dd>${publicResults.length / 2} pages · mobile and desktop</dd><dt>Source</dt><dd><a href="${runUrl}">View GitHub Action</a></dd>${revisionLink}</dl>
  <div class="report-notes"><p>These scores come from this deployment’s production build, tested in GitHub Actions with Lighthouse’s standard mobile and desktop presets. They measure a lab benchmark; real visits can vary with the device, network, and third-party services.</p><p>The homepage’s performance score is the median of three cold-browser runs. Accessibility, Best Practices, and SEO must pass in every run. Other site pages receive one run per device. The circles show the lowest verified category scores across those pages.</p><p>This report is generated after the site audits, then checked on both devices before publishing. Its own verification is kept with the Action’s artifacts, separate from the site results below.</p></div>
  <div class="report-table-scroll" role="region" aria-label="Page audit results, scroll horizontally to explore" tabindex="0"><table class="report-table"><caption>Scores by page and device</caption><thead><tr><th scope="col">Page</th><th scope="col">Device</th>${categories.map(([, label]) => `<th scope="col">${label}</th>`).join("")}<th scope="col">Details</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  const page = join(reportRoot, "index.html");
  const html = await readFile(page, "utf8");
  if (!marker.test(html))
    throw new Error("Lighthouse report page marker is missing");
  await writeFile(
    page,
    html.replace(
      marker,
      `<!-- LIGHTHOUSE_REPORT_START -->${content}<!-- LIGHTHOUSE_REPORT_END -->`
    )
  );
  await writeFile(
    join(reportRoot, "results.json"),
    JSON.stringify(
      { testedAt, runUrl, revision, scores, results: publicResults },
      null,
      2
    ) + "\n"
  );
  return { scores, count: publicResults.length, runUrl };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  console.log(await generateLighthouseReport());
}
