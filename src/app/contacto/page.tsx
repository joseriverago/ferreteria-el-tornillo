"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type RespuestaContacto = {
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

export default function ContactoPage() {
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function enviarMensaje(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    setEnviando(true);
    setAviso(null);

    try {
      const respuesta = await fetch("/api/contacto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: datos.get("nombre"),
          correo: datos.get("correo"),
          telefono: datos.get("telefono"),
          asunto: datos.get("asunto"),
          mensaje: datos.get("mensaje"),
        }),
      });

      const resultado: RespuestaContacto = await respuesta.json();

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
          "No pudimos confirmar el envío. Revisa tu conexión e inténtalo nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Contáctanos</h1>

        <p className="mt-3 text-slate-600">
          Envíanos tus consultas sobre nuestros productos o servicios.
          Los campos marcados con * son obligatorios.
        </p>

        <form
          onSubmit={enviarMensaje}
          aria-busy={enviando}
          className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <fieldset disabled={enviando} className="space-y-5">
            <legend className="sr-only">Datos de contacto y consulta</legend>

            <div>
              <label htmlFor="nombre" className="font-semibold">
                Nombre *
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
                Correo electrónico *
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
              <label htmlFor="telefono" className="font-semibold">
                Teléfono (opcional)
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                className={estiloCampo}
              />
            </div>

            <div>
              <label htmlFor="asunto" className="font-semibold">
                Asunto *
              </label>
              <input
                id="asunto"
                name="asunto"
                type="text"
                required
                minLength={3}
                maxLength={150}
                className={estiloCampo}
              />
            </div>

            <div>
              <label htmlFor="mensaje" className="font-semibold">
                Mensaje *
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={5}
                required
                minLength={10}
                maxLength={2000}
                className={estiloCampo}
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar mensaje"}
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