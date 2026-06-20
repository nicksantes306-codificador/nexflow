/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cabeçalhos de segurança (HSTS/X-Frame/X-Content) também são aplicados
  // pela Vercel via vercel.json — aqui garantimos paridade em dev/self-host.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
