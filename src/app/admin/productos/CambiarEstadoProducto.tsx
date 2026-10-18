"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

type Props = {
  id: string;
  nombre: string;
  activo: boolean;
  actualizadoEn: string | null;
};

const ExitoSchema = z.object({
  ok: z.literal(true),
});

const ErrorSchema = z.object({
  mensaje: z.string(),
});

export default function CambiarEstadoProducto({
  id,
  nombre,
  activo,
  actualizadoEn,
}: Props) {
  const router = useRouter();
  const bloqueo = useRef(false);

  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [error, setError] = useState("");

  async function cambiar() {
    if (bloqueo.current || completado) return;

    const pregunta = activo
      ? `¿Desactivar "${nombre}"? Dejará de ofrecerse en el catálogo. Sus cotizaciones anteriores se conservarán.`
      : `¿Reactivar "${nombre}" para mostrarlo nuevamente en el catálogo?`;

    if (!window.confirm(pregunta)) return;

    bloqueo.current = true;
    setEnviando(true);
    setError("");

    try {
      const respuesta = await fetch(`/api/admin/productos/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activo: !activo,
          actualizadoEn,
        }),
      });

      const datos: unknown = await respuesta.json();

      if (!respuesta.ok) {
        const detalle = ErrorSchema.safeParse(datos);

        setError(
          detalle.success
            ? detalle.data.mensaje
            : "No pudimos cambiar el estado."
        );

        return;
      }

      if (!ExitoSchema.safeParse(datos).success) {
        throw new Error("Respuesta inesperada.");
      }

      setCompletado(true);
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
    <div aria-busy={enviando}>
      <button
        type="button"
        disabled={enviando || completado}
        onClick={cambiar}
        aria-label={`${activo ? "Desactivar" : "Reactivar"} ${nombre}`}
        className="rounded-lg border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-100 disabled:opacity-50"
      >
        {enviando
          ? "Guardando..."
          : completado
            ? "Actualizado"
            : activo
              ? "Desactivar"
              : "Reactivar"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-red-700">
          {error}
        </p>
      )}

      {(error || completado) && (
        <button
          type="button"
          disabled={enviando}
          onClick={() => router.refresh()}
          className="mt-2 block underline"
        >
          Actualizar lista
        </button>
      )}
    </div>
  );
}