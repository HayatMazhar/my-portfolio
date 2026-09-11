import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  /**
   * Escape hatch for running an isolated build while a dev server holds .next
   * (they cannot share one: the build replaces the chunks the dev server is
   * serving). Not usable for deploys — `output: "standalone"` bakes the dist
   * directory name into required-server-files.json, so the packaged tree only
   * starts when this is the default ".next".
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
    serverComponentsExternalPackages: ["mammoth", "unpdf", "@resvg/resvg-js"],
  },
};

export default withMDX(nextConfig);
