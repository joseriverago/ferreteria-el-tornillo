"use client";

import Link from "next/link";
import { useCarrito } from "@/context/CarritoContext";
import EnviarCotizacion from "./EnviarCotizacion";
import useCatalogoCarrito from "@/app/carrito/useCatalogoCarrito";

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default function CarritoPage() {
  const {
    items,
    totalUnidades,
    actualizarCantidad,
    eliminarProducto,
    sincronizarCatalogo,
  } = useCarrito();

  const firma = JSON.stringify(
    items.map((item) => item.codigo).sort()
  );

  const {
    productos,
    verificado,
    actualizando,
    error,
    actualizar,
  } = useCatalogoCarrito(firma, sincronizarCatalogo);

  const porCodigo = new Map(
    productos.map((producto) => [producto.codigo, producto])
  );

  const seleccionValida =
    verificado &&
    items.every((item) => {
      const producto = porCodigo.get(item.codigo);

      return (
        producto !== undefined &&
        item.cantidad <= producto.stock
      );
    });

  const totalCentimos = items.reduce((total, item) => {
    const producto = porCodigo.get(item.codigo);

    return (
      total +
      Math.round((producto?.precio ?? 0) * 100) * item.cantidad
    );
  }, 0);

  const puedeEnviar =
    seleccionValida && Number.isSafeInteger(totalCentimos);

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

        {items.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold">
              Tu carrito está vacío
            </h2>

            <p className="mt-3 text-slate-600">
              Explora el catálogo y añade los productos que necesitas.
            </p>

            <Link
              href="/catalogo"
              className="mt-6 inline-block rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white"
            >
              Ver catálogo
            </Link>
          </section>
        ) : (
          <>
            <section
              className="mb-6 rounded-xl border border-slate-200 bg-white p-5"
              aria-busy={actualizando}
            >
              <p role="status">
                {actualizando
                  ? "Consultando precios y disponibilidad..."
                  : verificado
                    ? "Precios y disponibilidad consultados. Revisa tu selección antes de enviar."
                    : "Los datos del carrito aún no están verificados."}
              </p>

              <button
                type="button"
                disabled={actualizando}
                onClick={actualizar}
                className="mt-3 rounded-lg border border-orange-700 px-4 py-2 font-semibold text-orange-700 disabled:opacity-50"
              >
                Actualizar precios y disponibilidad
              </button>

              {error && (
                <p role="alert" className="mt-3 text-red-700">
                  {error}
                </p>
              )}
            </section>

            <p className="mb-4 text-sm text-slate-600">
              Productos distintos: {items.length} · Unidades totales:{" "}
              {totalUnidades}
            </p>

            <ul className="space-y-4">
              {items.map((item) => {
                const producto = porCodigo.get(item.codigo);
                const disponible =
                  verificado && producto !== undefined;

                const nombre = producto?.nombre ?? item.nombre;
                const stock = producto?.stock ?? 0;

                const subtotal =
                  Math.round((producto?.precio ?? 0) * 100) *
                  item.cantidad;

                return (
                  <li
                    key={item.codigo}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    {disponible ? (
                      <Link
                        href={`/catalogo/${encodeURIComponent(item.codigo)}`}
                        className="text-xl font-bold hover:text-orange-700 hover:underline"
                      >
                        {nombre}
                      </Link>
                    ) : (
                      <h2 className="text-xl font-bold">{nombre}</h2>
                    )}

                    <p className="mt-1 text-sm text-slate-500">
                      Código: {item.codigo}
                    </p>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-sm text-slate-600">
                          Precio unitario
                        </dt>
                        <dd className="mt-1 font-semibold">
                          {disponible
                            ? moneda.format(producto.precio)
                            : "Sin verificar"}
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
                              actualizarCantidad(
                                item.codigo,
                                item.cantidad - 1
                              )
                            }
                            disabled={
                              !disponible || item.cantidad <= 1
                            }
                            aria-label={`Disminuir cantidad de ${nombre}`}
                            className="h-10 w-10 rounded-lg border border-slate-300 font-bold disabled:opacity-40"
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
                              actualizarCantidad(
                                item.codigo,
                                item.cantidad + 1
                              )
                            }
                            disabled={
                              !disponible || item.cantidad >= stock
                            }
                            aria-label={`Aumentar cantidad de ${nombre}`}
                            className="h-10 w-10 rounded-lg border border-slate-300 font-bold disabled:opacity-40"
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
                          {disponible && item.cantidad <= stock
                            ? moneda.format(subtotal / 100)
                            : "Pendiente de revisión"}
                        </dd>
                      </div>
                    </dl>

                    {verificado && (
                      <p
                        className={
                          disponible && item.cantidad <= stock
                            ? "mt-4 text-green-700"
                            : "mt-4 text-red-700"
                        }
                      >
                        {!disponible
                          ? "Este producto ya no está disponible en el catálogo. Elimínalo del carrito para continuar."
                          : stock === 0
                            ? "Producto sin stock. Elimínalo del carrito o vuelve a consultar más adelante."
                            : item.cantidad > stock
                              ? `Solicitaste ${item.cantidad} unidades, pero solo hay ${stock}. Ajusta la cantidad.`
                              : `Disponibles: ${stock} unidades.`}
                      </p>
                    )}

                    {disponible &&
                      stock > 0 &&
                      item.cantidad > stock && (
                        <button
                          type="button"
                          onClick={() =>
                            actualizarCantidad(item.codigo, stock)
                          }
                          className="mt-3 block font-semibold text-orange-700 underline"
                        >
                          Ajustar a {stock} unidades
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() => eliminarProducto(item.codigo)}
                      aria-label={`Eliminar ${nombre} del carrito`}
                      className="mt-5 rounded-lg border border-red-700 px-4 py-2 font-semibold text-red-700"
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
                {puedeEnviar
                  ? moneda.format(totalCentimos / 100)
                  : "Pendiente de revisión"}
              </p>

              <p className="mt-3 text-sm text-slate-600">
                {puedeEnviar
                  ? "Importe calculado con los precios consultados. El servidor volverá a comprobarlos al procesar la solicitud."
                  : "Actualiza la disponibilidad y corrige los productos indicados antes de enviar."}
              </p>
            </section>
          </>
        )}

        <EnviarCotizacion habilitado={puedeEnviar} />
      </div>
    </main>
  );
}
