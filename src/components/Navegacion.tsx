"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCarrito } from "@/context/CarritoContext";

type NavegacionProps = {
  usuario: {
    nombre: string;
  } | null;
};

type RespuestaLogout = {
  ok: boolean;
  mensaje: string;
};

export default function Navegacion({ usuario }: NavegacionProps) {
  const { totalUnidades } = useCarrito();
  const router = useRouter();

  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");

  async function salir() {
    if (cerrando) return;

    setCerrando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const resultado: RespuestaLogout = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        setError(resultado.mensaje);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("No pudimos confirmar el cierre de sesión. Inténtalo nuevamente.");
    } finally {
      setCerrando(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-bold text-orange-700">
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

          {usuario ? (
            <>
              <span className="text-slate-600">
                Hola, {usuario.nombre}
              </span>

              <button
                type="button"
                onClick={salir}
                disabled={cerrando}
                className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cerrando ? "Cerrando..." : "Cerrar sesión"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-orange-700 hover:underline"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/registro"
                className="hover:text-orange-700 hover:underline"
              >
                Crear cuenta
              </Link>
            </>
          )}

          <Link
            href="/carrito"
            className="rounded-lg bg-orange-700 px-4 py-2 text-white hover:bg-orange-800"
          >
            Carrito ({totalUnidades})
          </Link>
        </nav>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-auto max-w-6xl px-6 pb-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </header>
  );
}