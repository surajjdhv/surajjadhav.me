import { readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Open serif monogram for the site; a stronger optical weight inside an ink
// circle keeps the same letterforms readable at browser-tab sizes.
const source = new URL("../src/assets/brand/sj-monogram.svg", import.meta.url);
const output = name => new URL(`../public/${name}`, import.meta.url);
const svg = await readFile(source);
await copyFile(source, output("logo.svg"));
const letterforms = svg
  .toString()
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>/, "")
  .trim()
  .replace('stroke-width="0.4"', 'stroke-width="1.2"');
const favicon = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" color="#FAF9F6"><circle cx="32" cy="32" r="32" fill="#292B28"/>${letterforms}</svg>`
);
await writeFile(output("favicon.svg"), favicon);
await sharp(favicon)
  .resize(32, 32)
  .png()
  .toFile(fileURLToPath(output("favicon-32x32.png")));
await sharp(favicon)
  .resize(180, 180)
  .flatten({ background: "#292B28" })
  .png()
  .toFile(fileURLToPath(output("apple-touch-icon.png")));

// ICO supports embedded PNGs. Keep all three native browser sizes in one file.
const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map(size => sharp(favicon).resize(size, size).png().toBuffer())
);
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  directory.writeUInt8(sizes[index], entry);
  directory.writeUInt8(sizes[index], entry + 1);
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(output("favicon.ico"), Buffer.concat([directory, ...images]));
console.log(
  "Generated SVG, PNG, ICO, and Apple touch icons from the SJ monogram."
);
