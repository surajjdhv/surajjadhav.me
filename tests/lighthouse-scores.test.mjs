import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeSamples } from "../scripts/lighthouse-scores.mjs";

function sample(performance, overrides = {}) {
  return {
    scores: {
      performance,
      accessibility: 100,
      "best-practices": 100,
      seo: 100,
    },
    runtimeError: null,
    ...overrides,
  };
}

test("one fast performance run cannot hide a majority of failing runs", () => {
  assert.equal(
    summarizeSamples([sample(95), sample(100), sample(98)]).scores.performance,
    98
  );
  assert.equal(
    summarizeSamples([sample(95), sample(100), sample(100)]).scores.performance,
    100
  );
});

test("a deterministic category failure or browser error in any sample blocks the gate", () => {
  const failing = sample(95);
  failing.scores.accessibility = 96;
  failing.runtimeError = { code: "NO_FCP" };
  const summary = summarizeSamples([failing, sample(100), sample(100)]);
  assert.equal(summary.scores.accessibility, 96);
  assert.deepEqual(summary.runtimeError, { code: "NO_FCP" });
  assert.equal(summary.samples.length, 3);
});
