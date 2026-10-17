import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 数据页需要请求时读 data/ 最新状态（ingest/study/library），
  因此关闭 Cache Components，让 `export const dynamic = "force-dynamic"` 生效。 */
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
