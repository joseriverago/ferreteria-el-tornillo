"use client";

import Link from "next/link";
import { useCarrito } from "@/context/CarritoContext";
import EnviarCotizacion from "./EnviarCotizacion";

const formatoPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default function CarritoPage() {
    //obtiene la selección que ya guardamos.
  const {
    items,
    totalUnidades,
    actualizarCantidad,
    eliminarProducto,
  } = useCarrito();

  const totalCentimos = items.reduce(
    (total, item) =>
      total + Math.round(item.precio * 100) * item.cantidad,
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/catalogo"
          className="font-semibold text-orange-700 hover:underline"
        >
          ← Seguir explorando el catálogo
        </Link>

        <header className="my-8">
          <h1 className="text-3xl font-bold">
            Carrito de cotización
          </h1>

          <p className="mt-2 text-slate-600">
            Revisa los productos seleccionados para tu solicitud.
          </p>
        </header>

        {items.length === 0 ? ( //cuenta productos distintos
          <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold">
              Tu carrito está vacío
            </h2>

            <p className="mt-3 text-slate-600">
              Explora el catálogo y añade los productos que necesitas.
            </p>

            <Link
              href="/catalogo"
              className="mt-6 inline-block rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800"
            >
              Ver catálogo
            </Link>
          </section>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Productos distintos: {items.length} · Unidades totales:{" "}
              {totalUnidades} 
            </p>

            <ul className="space-y-4">
              {items.map((item) => {
                const subtotalCentimos =
                  Math.round(item.precio * 100) * item.cantidad;

                return (
                  <li
                    key={item.codigo}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <Link
                      href={`/catalogo/${encodeURIComponent(item.codigo)}`}
                      className="text-xl font-bold hover:text-orange-700 hover:underline"
                    >
                      {item.nombre}
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      Código: {item.codigo}
                    </p>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-sm text-slate-600">
                          Precio unitario
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {formatoPrecio.format(item.precio)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm text-slate-600">
                            Cantidad
                        </dt>

                        <dd className="mt-2 flex items-center gap-3">
                            <button
                            type="button"
                            onClick={() =>
                                actualizarCantidad(item.codigo, item.cantidad - 1)
                            }
                            disabled={item.cantidad <= 1}
                            aria-label={`Disminuir cantidad de ${item.nombre}`}
                            className="h-10 w-10 rounded-lg border border-slate-300 font-bold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                            −
                            </button>

                            <span
                            aria-live="polite"
                            className="min-w-6 text-center font-semibold"
                            >
                            {item.cantidad}
                            </span>

                            <button
                            type="button"
                            onClick={() =>
                                actualizarCantidad(item.codigo, item.cantidad + 1)
                            }
                            disabled={item.cantidad >= item.stock}
                            aria-label={`Aumentar cantidad de ${item.nombre}`}
                            className="h-10 w-10 rounded-lg border border-slate-300 font-bold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                            +
                            </button>
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm text-slate-600">
                          Subtotal
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {formatoPrecio.format(subtotalCentimos / 100)}
                        </dd>
                      </div>
                    </dl>
                    <button
                        type="button"
                        onClick={() => eliminarProducto(item.codigo)}
                        aria-label={`Eliminar ${item.nombre} del carrito`}
                        className="mt-5 rounded-lg border border-red-700 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                        >
                        Eliminar producto
                    </button>
                  </li>
                );
              })}
            </ul>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">
                Total estimado
              </h2>

              <p className="mt-2 text-3xl font-bold">
                {formatoPrecio.format(totalCentimos / 100)}
              </p>

              <p className="mt-3 text-sm text-slate-600">
                Los precios y la disponibilidad se confirmarán al
                procesar tu solicitud de cotización.
              </p>
            </section>
          </>
        )}

        <EnviarCotizacion />
      </div>
    </main>
  );
}