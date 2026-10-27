import type { FontData } from "astro:assets";

export function getFontPathByWeight(
  fonts: FontData[],
  weight: number,
  options?: {
    style?: "normal" | "italic";
    format?: string;
  }
): string | undefined {
  const style = options?.style ?? "normal";
  const format = options?.format ?? "truetype";

  const sources = fonts
    .filter(font => font.weight === String(weight) && font.style === style)
    .flatMap(font => font.src);

  // Providers can emit WOFF2 and TrueType as separate entries for the same
  // weight. Search all entries before falling back: Satori cannot read WOFF2.
  return (
    sources.find(file => file.format === format) ??
    sources.find(file =>
      ["truetype", "opentype", "woff"].includes(file.format ?? "")
    )
  )?.url;
}
