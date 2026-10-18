"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

type Props = {
  id: string;
  estado: "pendiente" | "atendida" | "rechazada";
};

const ExitoSchema = z.object({
  ok: z.literal(true),
  cotizacion: z.object({
    id: z.string(),
    estado: z.enum(["atendida", "rechazada"]),
  }),
});

const ErrorSchema = z.object({
  mensaje: z.string(),
});

export default function AccionesCotizacion({ id, estado }: Props) {
  const router = useRouter();
  const bloqueo = useRef(false);

  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cambiar(nuevoEstado: "atendida" | "rechazada") {
    if (bloqueo.current || completado || estado !== "pendiente") return;

    const accion =
      nuevoEstado === "atendida" ? "marcar como atendida" : "rechazar";

    if (
      !window.confirm(
        `¿Deseas ${accion} esta cotización? Este cambio cierra su atención.`
      )
    ) {
      return;
    }

    bloqueo.current = true;
    setEnviando(true);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(`/api/admin/cotizaciones/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const datos: unknown = await respuesta.json();

      if (!respuesta.ok) {
        const detalle = ErrorSchema.safeParse(datos);

        setError(
          detalle.success
            ? detalle.data.mensaje
            : "No pudimos actualizar el estado."
        );

        if ([401, 403, 404, 409].includes(respuesta.status)) {
          router.refresh();
        }

        return;
      }

      const resultado = ExitoSchema.safeParse(datos);

      if (!resultado.success) {
        throw new Error("Respuesta inesperada.");
      }

      setCompletado(true);
      setMensaje(
        resultado.data.cotizacion.estado === "atendida"
          ? "Cotización marcada como atendida."
          : "Cotización rechazada."
      );

      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el cambio. Actualiza la lista para consultar el estado guardado."
      );
    } finally {
      bloqueo.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="mt-5" aria-busy={enviando}>
      {estado === "pendiente" && !completado && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={enviando}
            onClick={() => cambiar("atendida")}
            className="rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white hover:bg-orange-800 disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Marcar como atendida"}
          </button>

          <button
            type="button"
            disabled={enviando}
            onClick={() => cambiar("rechazada")}
            className="rounded-lg border border-red-700 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}

      {mensaje && (
        <p role="status" className="mt-3 text-green-800">
          {mensaje}
        </p>
      )}

      {error && (
        <div role="alert" className="mt-3 text-red-700">
          <p>{error}</p>

          <button
            type="button"
            disabled={enviando}
            onClick={() => router.refresh()}
            className="mt-2 underline"
          >
            Actualizar lista
          </button>
        </div>
      )}
    </div>
  );
}