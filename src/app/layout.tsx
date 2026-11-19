import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Habitat · Propiedades en venta y alquiler",
    template: "%s · Habitat",
  },
  description:
    "Encontrá casas, departamentos, terrenos y locales en venta y alquiler. Consultá y pedí una visita sin registrarte.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
