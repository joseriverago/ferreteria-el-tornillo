"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type RespuestaLogin = {
  ok: boolean;
  mensaje: string;
  errores?: {
    campo: string;
    mensaje: string;
  }[];
};

type Aviso = {
  tipo: "exito" | "error";
  texto: string;
};

const estiloCampo =
  "mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 " +
  "focus:border-orange-700 focus:outline-none focus:ring-2 " +
  "focus:ring-orange-700";

export default function FormularioLogin() {
  const router = useRouter();

  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    setEnviando(true);
    setAviso(null);

    try {
      const respuesta = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: datos.get("correo"),
          password: datos.get("password"),
        }),
      });

      const resultado: RespuestaLogin = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        const detalle = resultado.errores
          ?.map((error) => error.mensaje)
          .join(" ");

        setAviso({
          tipo: "error",
          texto: detalle || resultado.mensaje,
        });
        return;
      }

      formulario.reset();

      router.replace("/");
      router.refresh();
      
    } catch {
      setAviso({
        tipo: "error",
        texto:
          "No pudimos confirmar el inicio de sesión. Revisa tu conexión e inténtalo nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Iniciar sesión</h1>

        <p className="mt-3 text-slate-600">
          Ingresa el correo y la contraseña de tu cuenta.
        </p>

        <form
          onSubmit={iniciarSesion}
          aria-busy={enviando}
          className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <fieldset disabled={enviando} className="space-y-5">
            <legend className="sr-only">Datos de acceso</legend>

            <div>
              <label htmlFor="correo" className="font-semibold">
                Correo electrónico
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                className={estiloCampo}
              />
            </div>

            <div>
              <label htmlFor="password" className="font-semibold">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
                className={estiloCampo}
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </fieldset>

          <div role="status" aria-live="polite" aria-atomic="true">
            {aviso && (
              <p
                className={`mt-5 rounded-lg p-4 ${
                  aviso.tipo === "exito"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {aviso.texto}
              </p>
            )}
          </div>

          <p className="mt-6 text-sm text-slate-600">
            ¿Todavía no tienes una cuenta?{" "}
            <Link
              href="/registro"
              className="font-semibold text-orange-700 hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}