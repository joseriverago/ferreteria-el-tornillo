"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { useCarrito } from "@/context/CarritoContext";

const ConfirmacionSchema = z.object({
  ok: z.literal(true),
  cotizacion: z.object({
    id: z.string().min(1),
    totalCentimos: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    estado: z.literal("pendiente"),
  }),
});

const ErrorSchema = z.object({ mensaje: z.string() });

type Confirmacion = z.infer<typeof ConfirmacionSchema>["cotizacion"];

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default function EnviarCotizacion() {
  const { items } = useCarrito();
  const [observacion, setObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [requiereLogin, setRequiereLogin] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const bloqueo = useRef(false);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (bloqueo.current || confirmacion || items.length === 0) return;

    bloqueo.current = true;
    setEnviando(true);
    setError("");
    setRequiereLogin(false);

    try {
      const respuesta = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          items: items.map(({ codigo, cantidad }) => ({ codigo, cantidad })),
          observacion: observacion.trim(),
        }),
      });

      const datos: unknown = await respuesta.json();

      if (!respuesta.ok) {
        const detalle = ErrorSchema.safeParse(datos);

        setRequiereLogin(respuesta.status === 401);
        setError(
          detalle.success
            ? detalle.data.mensaje
            : "No pudimos procesar la solicitud. Inténtalo nuevamente."
        );
        return;
      }

      const resultado = ConfirmacionSchema.safeParse(datos);

      if (!resultado.success) {
        throw new Error("Confirmación inesperada.");
      }

      setConfirmacion(resultado.data.cotizacion);
    } catch {
      setError(
        "No pudimos confirmar el resultado del envío. Antes de repetirlo, verifica si la cotización quedó registrada."
      );
    } finally {
      bloqueo.current = false;
      setEnviando(false);
    }
  }

  if (confirmacion) {
    return (
      <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
        <div role="status">
          <h2 className="text-xl font-bold text-green-900">
            Cotización enviada correctamente
          </h2>

          <p className="mt-3 break-all">Número: {confirmacion.id}</p>

          <p className="mt-2">
            Total estimado registrado:{" "}
            {moneda.format(confirmacion.totalCentimos / 100)}
          </p>

          <p className="mt-2">Estado: pendiente de atención.</p>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          Conservamos tu selección en el carrito. Esta solicitud no reserva
          stock ni genera un cobro.
        </p>
        <div className="mt-4">
          <Link
            href="/mis-cotizaciones"
            className="font-semibold text-orange-700 hover:underline"
          >
            Ver mis cotizaciones
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            setConfirmacion(null);
            setObservacion("");
            setError("");
            setRequiereLogin(false);
          }}
          className="mt-5 rounded-lg border border-orange-700 px-5 py-3 font-semibold text-orange-700 hover:bg-orange-50"
        >
          Preparar otra cotización
        </button>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <form
      onSubmit={enviar}
      aria-busy={enviando}
      className="mt-6 rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-xl font-bold">Solicitar cotización</h2>

      <p className="mt-2 text-sm text-slate-600">
        Necesitas iniciar sesión con una cuenta de cliente. El total se
        calculará con los precios actuales del catálogo.
      </p>

      <label htmlFor="observacion" className="mt-5 block font-semibold">
        Observación (opcional)
      </label>

      <textarea
        id="observacion"
        value={observacion}
        onChange={(event) => setObservacion(event.target.value)}
        maxLength={1000}
        rows={4}
        disabled={enviando}
        aria-describedby="limite-observacion"
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 disabled:opacity-60"
      />

      <p id="limite-observacion" className="mt-1 text-sm text-slate-500">
        {observacion.length}/1000 caracteres
      </p>

      <button
        type="submit"
        disabled={enviando}
        className="mt-5 rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Enviando cotización..." : "Enviar cotización"}
      </button>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
          <p>{error}</p>

          {requiereLogin && (
            <Link
              href="/login"
              className="mt-2 inline-block font-semibold underline"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
    </form>
  );
}