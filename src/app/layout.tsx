import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CarritoProvider } from "@/context/CarritoContext";
import Navegacion from "@/components/Navegacion";
import { obtenerUsuarioActual } from "@/lib/sesion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ferretería El Tornillo",
  description: "Catálogo de productos y cotizaciones en línea",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const usuario = await obtenerUsuarioActual();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CarritoProvider>
          <Navegacion
            usuario={usuario ? { nombre: usuario.nombre } : null}
          />
          {children}
        </CarritoProvider>
      </body>
    </html>
  );
}
