"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { ItemCarrito } from "@/types/carrito";

const CLAVE = "ferreteria-el-tornillo:carrito:v1";

const ItemGuardadoSchema = z
  .object({
    codigo: z.string().min(1),
    nombre: z.string().min(1),
    precio: z.number().finite().nonnegative(),
    stock: z.number().int().nonnegative(),
    cantidad: z.number().int().positive(),
  })
  .refine((item) => item.cantidad <= item.stock);

const CarritoGuardadoSchema = z
  .array(ItemGuardadoSchema)
  .refine(
    (items) =>
      new Set(items.map((item) => item.codigo)).size === items.length
  );

const VACIO: ItemCarrito[] = [];
let memoria: ItemCarrito[] = VACIO;
let textoAnterior: string | null | undefined;

const suscriptores = new Set<() => void>();

function leerCarrito(): ItemCarrito[] { //recupera la selección
  try {
    const texto = window.localStorage.getItem(CLAVE);

    if (texto !== textoAnterior) {
      textoAnterior = texto;

      if (texto === null) {
        memoria = VACIO;
      } else {
        memoria = VACIO;

        const resultado = CarritoGuardadoSchema.safeParse(
          JSON.parse(texto)
        );

        memoria = resultado.success ? resultado.data : VACIO;
      }
    }
  } catch {
    // Si el JSON está dañado, usamos un carrito vacío.
    // Si el navegador bloquea el almacenamiento, conservamos la memoria.
    if (textoAnterior !== undefined && memoria === VACIO) {
      return VACIO;
    }
  }

  return memoria;
}

function actualizarCarrito( //guarda cada incorporación, modificación o eliminación.
  actualizar: (actuales: ItemCarrito[]) => ItemCarrito[]
) {
  const siguientes = actualizar(leerCarrito());
  memoria = siguientes;

  try {
    const texto = JSON.stringify(siguientes);
    window.localStorage.setItem(CLAVE, texto);
    textoAnterior = texto;
  } catch {
    console.warn(
      "El carrito funciona en memoria, pero no pudo guardarse en el navegador."
    );
  }

  suscriptores.forEach((notificar) => notificar());
}

function suscribir(notificar: () => void) {
  suscriptores.add(notificar);

  function alCambiarAlmacenamiento(evento: StorageEvent) {
    if (evento.key === CLAVE || evento.key === null) { //CLAVE: identifica exclusivamente el carrito de esta aplicación.
      notificar();
    }
  }

  window.addEventListener("storage", alCambiarAlmacenamiento);

  return () => {
    suscriptores.delete(notificar);
    window.removeEventListener("storage", alCambiarAlmacenamiento);
  };
}

function obtenerCarritoDelServidor(): ItemCarrito[] {
  return VACIO;
}

export function useCarritoPersistente() {
  const items = useSyncExternalStore( //conecta React con ese almacenamiento y contempla el renderizado inicial del servidor.
    suscribir,
    leerCarrito,
    obtenerCarritoDelServidor
  );

  return [items, actualizarCarrito] as const;
}