import { readFile, writeFile } from "node:fs/promises";

const files = [
  ...Array.from({ length: 9 }, (_, i) => `v${60 + i}.js`),
  "v71.js",
  "v72.js",
  ...Array.from({ length: 16 }, (_, i) => `v${73 + i}.js`)
];
const chunks = await Promise.all(files.map(async file => {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  return `/* ---- ${file} ---- */\n${source.trim()}\n`;
}));
await writeFile(new URL("../siteplan-runtime-20260912.js", import.meta.url), chunks.join("\n"), "utf8");
