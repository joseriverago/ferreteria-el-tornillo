"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type RespuestaRegistro = {
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

export default function RegistroPage() {
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function registrarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    const password = datos.get("password");
    const confirmarPassword = datos.get("confirmarPassword");

    setAviso(null);

    if (password !== confirmarPassword) {
      setAviso({
        tipo: "error",
        texto: "Las contraseñas no coinciden.",
      });
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch("/api/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: datos.get("nombre"),
          correo: datos.get("correo"),
          password,
        }),
      });

      const resultado: RespuestaRegistro = await respuesta.json();

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

      setAviso({
        tipo: "exito",
        texto: resultado.mensaje,
      });
    } catch {
      setAviso({
        tipo: "error",
        texto:
          "No pudimos confirmar el registro. Revisa tu conexión e inténtalo nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Crear cuenta</h1>

        <p className="mt-3 text-slate-600">
          Completa tus datos para registrarte como cliente.
          Todos los campos son obligatorios.
        </p>

        <form
          onSubmit={registrarUsuario}
          aria-busy={enviando}
          className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <fieldset disabled={enviando} className="space-y-5">
            <legend className="sr-only">Datos de registro</legend>

            <div>
              <label htmlFor="nombre" className="font-semibold">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                className={estiloCampo}
              />
            </div>

            <div>
              <label htmlFor="correo" className="font-semibold">
                Correo electrónico
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
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
                autoComplete="new-password"
                required
                minLength={15}
                maxLength={128}
                aria-describedby="ayuda-password"
                className={estiloCampo}
              />
              <p
                id="ayuda-password"
                className="mt-2 text-sm text-slate-600"
              >
                Usa entre 15 y 128 caracteres. Puedes utilizar una
                frase larga que recuerdes.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmarPassword"
                className="font-semibold"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmarPassword"
                name="confirmarPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={15}
                maxLength={128}
                className={estiloCampo}
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Creando cuenta..." : "Crear cuenta"}
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
        </form>
      </div>
    </main>
  );
}