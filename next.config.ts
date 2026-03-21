import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "85e42a13-059f-4691-87fe-dfd1c317ba52-00-2lxn6804ysubh.picard.replit.dev",
  ],

  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8080"},
      { protocol: "https", hostname: "*.onrender.com"},
      { protocol: "https", hostname: "res.cloudinary.com"},
    ],
  },

  /**
   * *** ADICIONADO: variável server-side para o Route Handler de streaming ***
   *
   * API_URL       → usada server-side (Route Handlers, Server Components)
   *                 NÃO tem o prefixo NEXT_PUBLIC, então não vaza para o browser
   *
   * NEXT_PUBLIC_API_URL → continua existindo para o Axios client-side
   *                        (lib/api.ts, componentes "use client")
   *
   * No .env.local (desenvolvimento):
   *   API_URL=http://localhost:8080
   *   NEXT_PUBLIC_API_URL=http://localhost:8080
   *
   * No Vercel (produção):
   *   API_URL=https://seu-backend.onrender.com      (Environment Variable)
   *   NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com
   */
  env: {
    API_URL: process.env.API_URL,
  },
};

export default nextConfig;