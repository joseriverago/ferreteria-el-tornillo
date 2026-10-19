"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { ProductoCarrito } from "@/types/carrito";

const CatalogoSchema = z
  .object({
    ok: z.literal(true),
    total: z.number().int().nonnegative(),
    productos: z.array(
      z.object({
        codigo: z.string().min(1),
        nombre: z.string().min(1),
        precio: z.number().finite().nonnegative(),
        stock: z.number().int().nonnegative(),
      })
    ),
  })
  .refine(
    ({ total, productos }) =>
      total === productos.length &&
      new Set(productos.map((p) => p.codigo)).size === productos.length
  );

type Resultado = {
  clave: string;
  productos: ProductoCarrito[];
  error: string;
};

export default function useCatalogoCarrito(
  firma: string,
  sincronizar: (productos: ProductoCarrito[]) => void
) {
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const clave = `${revision}:${firma}`;

  useEffect(() => {
    function alVolver() {
      setRevision((valor) => valor + 1);
    }

    window.addEventListener("focus", alVolver);

    return () => {
      window.removeEventListener("focus", alVolver);
    };
  }, []);

  useEffect(() => {
    if (firma === "[]") return;

    const control = new AbortController();

    async function consultar() {
      try {
        const respuesta = await fetch("/api/productos", {
          cache: "no-store",
          signal: control.signal,
        });

        if (!respuesta.ok) {
          throw new Error("Consulta fallida.");
        }

        const datos: unknown = await respuesta.json();
        const validacion = CatalogoSchema.safeParse(datos);

        if (!validacion.success) {
          throw new Error("Respuesta inválida.");
        }

        if (control.signal.aborted) return;

        sincronizar(validacion.data.productos);

        setResultado({
          clave,
          productos: validacion.data.productos,
          error: "",
        });
      } catch {
        if (control.signal.aborted) return;

        setResultado({
          clave,
          productos: [],
          error:
            "No pudimos comprobar los precios y la disponibilidad. Conservamos tu selección. Pulsa Actualizar para reintentar.",
        });
      }
    }

    void consultar();

    return () => {
      control.abort();
    };
  }, [firma, clave, sincronizar]);

  const vigente = resultado?.clave === clave;
  const verificado = vigente && resultado.error === "";

  return {
    productos: verificado ? resultado.productos : [],
    verificado,
    actualizando: firma !== "[]" && !vigente,
    error: vigente ? resultado.error : "",
    actualizar: () => setRevision((valor) => valor + 1),
  };
}