import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

export default defineConfig({
  site: config.site.url,
  build: {
    // This text-focused site has a small shared stylesheet. Inline it so the
    // first render does not wait for another mobile-network round trip.
    inlineStylesheets: "always",
  },
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
  ],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Instrument Serif",
      cssVariable: "--font-instrument-serif",
      provider: fontProviders.google(),
      fallbacks: ["Georgia", "serif"],
      weights: [400],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      formats: ["woff2"],
      display: "swap",
    },
    {
      name: "Manrope",
      cssVariable: "--font-manrope",
      provider: fontProviders.google(),
      fallbacks: ["Arial", "sans-serif"],
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      display: "swap",
    },
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.local(),
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: [
              "./node_modules/@fontsource/google-sans-code/files/google-sans-code-latin-400-normal.woff2",
            ],
          },
          {
            weight: 700,
            style: "normal",
            src: [
              "./node_modules/@fontsource/google-sans-code/files/google-sans-code-latin-700-normal.woff2",
            ],
          },
        ],
      },
      fallbacks: ["monospace"],
      weights: [400, 700],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
      display: "swap",
    },
    {
      // Satori needs TrueType, but these faces must never be included in the
      // browser's @font-face rules or they override the smaller WOFF2 files.
      name: "Google Sans Code",
      cssVariable: "--font-og-mono",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400, 700],
      styles: ["normal"],
      formats: ["ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
