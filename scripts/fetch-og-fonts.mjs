// Downloads the static Inter TTFs that satori renders the LinkedIn cards with.
//
// Run once; the files are committed so deploys and CI never depend on Google.
// satori cannot read woff2, and the css2 endpoint only offers woff2 to modern
// browsers, so we ask with an ancient User-Agent to get TTF URLs back.
//
// Usage: node scripts/fetch-og-fonts.mjs

import { mkdir, writeFile } from "node:fs/promises";

const OUT_DIR = "public/fonts";

const WANTED = [
  { family: "Inter", weight: 400, file: "Inter-Regular.ttf" },
  { family: "Inter", weight: 500, file: "Inter-Medium.ttf" },
  { family: "Inter", weight: 700, file: "Inter-Bold.ttf" },
  { family: "Inter Tight", weight: 700, file: "InterTight-Bold.ttf" },
];

/**
 * Google picks the format from the User-Agent. Modern browsers get woff2 and
 * IE gets EOT, neither of which satori can parse, so try the older engines that
 * predate woff support until one hands back a TTF.
 */
const TTF_USER_AGENTS = [
  "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1) Gecko/20090624 Firefox/3.5",
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.86 Safari/533.4",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.517.41 Safari/534.7",
];

function isTtf(bytes) {
  const magic = bytes.subarray(0, 4).toString("latin1");
  return (
    magic === "\u0000\u0001\u0000\u0000" || magic === "true" || magic === "ttcf"
  );
}

async function fetchTtf(family, weight) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weight}`;

  const failures = [];
  for (const ua of TTF_USER_AGENTS) {
    const cssRes = await fetch(cssUrl, { headers: { "User-Agent": ua } });
    if (!cssRes.ok) {
      failures.push(`css ${cssRes.status}`);
      continue;
    }
    const css = await cssRes.text();
    // TTF comes from an extension-less /l/font?kit= URL on these endpoints.
    const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
    if (!match) {
      failures.push("no url in css");
      continue;
    }
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) {
      failures.push(`font ${fontRes.status}`);
      continue;
    }
    const bytes = Buffer.from(await fontRes.arrayBuffer());
    if (!isTtf(bytes)) {
      failures.push(
        `format ${JSON.stringify(bytes.subarray(0, 4).toString("latin1"))}`,
      );
      continue;
    }
    return { bytes, url: match[1] };
  }

  throw new Error(
    `Could not get TTF for ${family} ${weight}: ${failures.join(", ")}`,
  );
}

await mkdir(OUT_DIR, { recursive: true });

for (const { family, weight, file } of WANTED) {
  const { bytes } = await fetchTtf(family, weight);
  await writeFile(`${OUT_DIR}/${file}`, bytes);
  console.log(
    `${file.padEnd(22)} ${(bytes.length / 1024).toFixed(0).padStart(5)} KB`,
  );
}
