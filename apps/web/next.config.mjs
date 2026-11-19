/** @type {import('next').NextConfig} */
const nextConfig = {
  // The simulation engine is shipped as TypeScript source inside the monorepo.
  transpilePackages: ['@os-lab/engine'],
};
export default nextConfig;
