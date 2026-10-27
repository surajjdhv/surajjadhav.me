// A performance sample can vary with host CPU load. Keep the median sample,
// while requiring every sample to pass the deterministic categories.
export function summarizeSamples(samples) {
  const ordered = [...samples].sort(
    (a, b) => a.scores.performance - b.scores.performance
  );
  const median = ordered[Math.floor(ordered.length / 2)];
  return {
    ...median,
    scores: Object.fromEntries(
      Object.keys(median.scores).map(category => [
        category,
        category === "performance"
          ? median.scores.performance
          : Math.min(...samples.map(sample => sample.scores[category])),
      ])
    ),
    runtimeError:
      samples.find(sample => sample.runtimeError)?.runtimeError ?? null,
    samples,
  };
}
