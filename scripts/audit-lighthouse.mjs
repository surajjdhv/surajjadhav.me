import { createServer } from "node:http";
import { readFile, readdir, stat, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, extname, sep, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants } from "node:zlib";
import { summarizeSamples } from "./lighthouse-scores.mjs";

const run = promisify(execFile);
const brotli = promisify(brotliCompress);
const gz = promisify(gzip);
const root = resolve("dist");
const output = resolve(".lighthouse");
const cli = fileURLToPath(import.meta.resolve("lighthouse/cli/index.js"));
const requestedPaths = process.argv
  .slice(2)
  .filter(argument => argument.startsWith("/"));
const factors = process.argv.includes("--mobile")
  ? ["mobile"]
  : process.argv.includes("--desktop")
    ? ["desktop"]
    : ["mobile", "desktop"];
const baseArgument = process.argv.find(argument =>
  argument.startsWith("--url=")
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".wasm": "application/wasm",
};

async function htmlPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(entry =>
      entry.isDirectory()
        ? htmlPages(join(directory, entry.name))
        : entry.name.endsWith(".html") && entry.name !== "404.html"
          ? [join(directory, entry.name)]
          : []
    )
  );
  return groups.flat();
}

// Serve the actual static export, with standard production compression and the
// same immutable asset policy configured for Netlify. Audit cold browser loads.
const server = baseArgument
  ? undefined
  : createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(
          new URL(request.url, "http://localhost").pathname
        );
        let path = resolve(root, `.${pathname}`);
        if (path !== root && !path.startsWith(root + sep))
          throw new Error("Invalid path");
        if ((await stat(path)).isDirectory()) path = join(path, "index.html");
        let body = await readFile(path);
        const extension = extname(path);
        response.setHeader(
          "Content-Type",
          types[extension] ?? "application/octet-stream"
        );
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader(
          "Cache-Control",
          pathname.startsWith("/_astro/")
            ? "public, max-age=31536000, immutable"
            : "public, max-age=0, must-revalidate"
        );
        if (
          [".html", ".css", ".js", ".json", ".svg", ".xml", ".txt"].includes(
            extension
          )
        ) {
          response.setHeader("Vary", "Accept-Encoding");
          const accepts = request.headers["accept-encoding"] ?? "";
          if (accepts.includes("br")) {
            body = await brotli(body, {
              params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
            });
            response.setHeader("Content-Encoding", "br");
          } else if (accepts.includes("gzip")) {
            body = await gz(body);
            response.setHeader("Content-Encoding", "gzip");
          }
        }
        response.setHeader("Content-Length", body.length);
        response.end(request.method === "HEAD" ? undefined : body);
      } catch {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("Not found");
      }
    });

const results = [];
try {
  if (server)
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = baseArgument
    ? baseArgument.slice("--url=".length).replace(/\/$/, "")
    : `http://127.0.0.1:${server.address().port}`;
  const paths = requestedPaths.length
    ? requestedPaths
    : (await htmlPages(root))
        .map(
          path =>
            "/" +
            relative(root, path)
              .split(sep)
              .join("/")
              .replace(/index\.html$/, "")
        )
        .sort();
  for (const factor of factors) {
    const directory = join(output, factor);
    await mkdir(directory, { recursive: true });
    for (const path of paths) {
      const name = path.replace(/^\/|\/$/g, "").replaceAll("/", "--") || "home";
      // The homepage is the first and most variable cold load on CI. Always
      // collect three independent samples, rather than retrying until one passes.
      const sampleCount = path === "/" ? 3 : 1;
      const samples = [];
      for (let sample = 1; sample <= sampleCount; sample++) {
        const report = join(
          directory,
          sampleCount > 1 ? `${name}--run-${sample}` : name
        );
        console.log(`Auditing ${factor}: ${path} (${sample}/${sampleCount})`);
        await run(
          process.execPath,
          [
            cli,
            new URL(path, base).href,
            "--chrome-flags=--headless=new",
            "--only-categories=performance,accessibility,best-practices,seo",
            "--output=html",
            "--output=json",
            `--output-path=${report}`,
            "--quiet",
            ...(factor === "desktop" ? ["--preset=desktop"] : []),
          ],
          { timeout: 120000, maxBuffer: 2 * 1024 * 1024 }
        );
        const lhr = JSON.parse(await readFile(`${report}.report.json`, "utf8"));
        const scores = Object.fromEntries(
          Object.entries(lhr.categories).map(([key, category]) => [
            key,
            Math.round(category.score * 100),
          ])
        );
        const result = {
          path,
          factor,
          scores,
          version: lhr.lighthouseVersion,
          url: lhr.finalDisplayedUrl,
          report: relative(resolve("."), `${report}.report.html`),
          runtimeError: lhr.runtimeError ?? null,
        };
        samples.push(result);
        console.log(
          `  ${Object.entries(scores)
            .map(([key, score]) => `${key}: ${score}`)
            .join(" | ")}`
        );
      }
      const result = summarizeSamples(samples);
      results.push(result);
      if (sampleCount > 1) {
        console.log(
          `  Median performance: ${result.scores.performance}; all other categories use the lowest sample score.`
        );
      }
      await writeFile(
        join(output, "summary.json"),
        JSON.stringify(
          {
            testedAt: new Date().toISOString(),
            source: baseArgument ? "deployed" : "local production build",
            results,
          },
          null,
          2
        ) + "\n"
      );
    }
  }
  const failures = results.filter(
    result =>
      result.runtimeError ||
      Object.values(result.scores).some(score => score < 100)
  );
  console.log(
    `\n${results.length - failures.length}/${results.length} audits reached 100 in all four categories. Reports: ${output}`
  );
  if (failures.length) process.exitCode = 1;
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
}
