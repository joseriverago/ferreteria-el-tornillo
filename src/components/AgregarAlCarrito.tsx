"use client";
import Link from "next/link";

import { useCarrito } from "@/context/CarritoContext";
import type { ProductoCarrito } from "@/types/carrito";

export default function AgregarAlCarrito({
  producto,
}: {
  producto: ProductoCarrito;
}) {
  const { items, agregarProducto, totalUnidades } = useCarrito();

  const cantidadActual =
    items.find((item) => item.codigo === producto.codigo)?.cantidad ?? 0;

  const sinStock = producto.stock <= 0;
  const limiteAlcanzado = cantidadActual >= producto.stock;

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <button
        type="button"
        onClick={() => agregarProducto(producto)}
        disabled={sinStock || limiteAlcanzado}
        className="rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {sinStock
          ? "Sin stock"
          : limiteAlcanzado
            ? "Stock máximo alcanzado"
            : "Añadir a cotización"}
      </button>

      <Link
        href="/carrito"
        className="mt-3 block w-fit rounded-lg border border-orange-700 px-5 py-3 font-semibold text-orange-700 hover:bg-orange-50"
      >
        Ver carrito ({totalUnidades})
      </Link>

      <div
        aria-live="polite" //permite que los lectores de pantalla anuncien el cambio de los contadores.
        className="mt-3 space-y-1 text-sm text-slate-600"
      >
        <p>Unidades de este producto en el carrito: {cantidadActual}</p>
        <p>Total de unidades en el carrito: {totalUnidades}</p>
      </div>
    </div>
  );
}