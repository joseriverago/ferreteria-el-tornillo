"use client";

import Link from "next/link";
import { useCarrito } from "@/context/CarritoContext";

export default function Navegacion() {
  const { totalUnidades } = useCarrito();

  return (
    <header className="border-b border-slate-200 bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold text-orange-700"
        >
          Ferretería El Tornillo
        </Link>

        <nav
          aria-label="Navegación principal"
          className="flex flex-wrap items-center gap-4 text-sm font-semibold"
        >
          <Link
            href="/"
            className="hover:text-orange-700 hover:underline"
          >
            Inicio
          </Link>

          <Link
            href="/catalogo"
            className="hover:text-orange-700 hover:underline"
          >
            Catálogo
          </Link>
          <Link
            href="/contacto"
            className="hover:text-orange-700 hover:underline"
          >
            Contacto
          </Link>
          <Link
            href="/carrito"
            className="rounded-lg bg-orange-700 px-4 py-2 text-white hover:bg-orange-800"
          >
            Carrito ({totalUnidades})
          </Link>
        </nav>
      </div>
    </header>
  );
}