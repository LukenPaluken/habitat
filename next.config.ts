import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Files and folders are named in English; the public URLs are in Spanish.
  async rewrites() {
    return [
      { source: "/propiedades/:id", destination: "/properties/:id" },
      { source: "/inmobiliarias/:id", destination: "/agencies/:id" },
      { source: "/registro", destination: "/register" },
      { source: "/panel/propiedades", destination: "/panel/properties" },
      {
        source: "/panel/propiedades/nueva",
        destination: "/panel/properties/new",
      },
      {
        source: "/panel/propiedades/:id/editar",
        destination: "/panel/properties/:id/edit",
      },
      { source: "/panel/inmobiliaria", destination: "/panel/agency" },
      { source: "/panel/visitas", destination: "/panel/visits" },
      { source: "/panel/consultas", destination: "/panel/inquiries" },
      { source: "/panel/actividad", destination: "/panel/activity" },
      { source: "/panel/reportes", destination: "/panel/reports" },
    ];
  },
  images: {
    // Hosts the property photos come from: UploadThing in production and
    // picsum.photos for the demo data of `bun run db:seed`.
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
