/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/blog",
  trailingSlash: true,
  // GitHub Pages deploys a static export — actions/configure-pages injects
  // `output: "export"` (plus unoptimized images) at build time in CI, so a
  // plain local `next build` doesn't normally produce one. STATIC_EXPORT
  // lets the Docker Compose replica (docker/) opt into the same static
  // export CI produces, without changing local dev/build/e2e behavior.
  ...(process.env.STATIC_EXPORT === "true"
    ? { output: "export", images: { unoptimized: true } }
    : {}),
};

export default nextConfig;