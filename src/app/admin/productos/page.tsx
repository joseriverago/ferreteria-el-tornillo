import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { verificarPermiso } from "@/lib/permisos";
import Product from "@/models/Product";
import CambiarEstadoProducto from "./CambiarEstadoProducto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAMANO_PAGINA = 10;

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

type Props = {
  searchParams: Promise<{ pagina?: string | string[] }>;
};

export default async function ProductosAdminPage({ searchParams }: Props) {
  const acceso = await verificarPermiso(["administrador"]);

  if (!acceso.permitido) {
    if (acceso.estado === 401) redirect("/login");

    return (
      <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-6">
          <h1 className="text-3xl font-bold">Acceso restringido</h1>

          <p className="mt-4">{acceso.mensaje}</p>

          <Link
            href="/"
            className="mt-4 inline-block font-semibold text-orange-700"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const parametros = await searchParams;

  const pagina =
    typeof parametros.pagina === "string" &&
    /^[1-9]\d{0,4}$/.test(parametros.pagina)
      ? Number(parametros.pagina)
      : 1;

  await connectDB();

  const resultados = await Product.find({})
    .select("_id codigo nombre categoria precio stock activo updatedAt")
    .sort({ nombre: 1, _id: 1 })
    .skip((pagina - 1) * TAMANO_PAGINA)
    .limit(TAMANO_PAGINA + 1)
    .lean();

  const haySiguiente = resultados.length > TAMANO_PAGINA;
  const productos = resultados.slice(0, TAMANO_PAGINA);

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          Administración de productos
        </h1>

        <p className="mt-2 text-slate-600">
          Consulta los precios y las existencias registradas en el catálogo.
        </p>

        <Link
          href="/admin"
          className="mt-4 inline-block font-semibold text-orange-700 hover:underline"
        >
          Volver al panel
        </Link>

        <div className="mt-6">
            <Link
                href="/admin/productos/nuevo"
                className="inline-block rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800"
            >
                Crear producto
            </Link>
        </div>

        {productos.length === 0 ? (
          <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            {pagina === 1
              ? "Todavía no hay productos registrados."
              : "No hay productos en esta página."}
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Productos registrados en el catálogo
              </caption>

              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Código
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Categoría
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Precio
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {productos.map((producto) => (
                  <tr
                    key={producto._id.toString()}
                    className="border-t border-slate-200"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      {producto.codigo}
                    </td>

                    <th scope="row" className="px-4 py-4 font-semibold">
                      {producto.nombre}
                    </th>

                    <td className="px-4 py-4">
                      {producto.categoria}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      {moneda.format(producto.precio)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      {producto.stock === 0 ? (
                        <span className="whitespace-nowrap font-semibold text-red-700">
                          Sin stock
                        </span>
                      ) : (
                        producto.stock
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={
                          producto.activo !== false
                            ? "font-semibold text-green-700"
                            : "font-semibold text-slate-600"
                        }
                      >
                        {producto.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {producto.activo !== false && (
                          <Link
                            href={`/catalogo/${encodeURIComponent(producto.codigo)}`}
                            aria-label={`Ver ${producto.nombre} en el catálogo`}
                            className="font-semibold text-orange-700 hover:underline"
                          >
                            Ver en catálogo
                          </Link>
                        )}

                        <Link
                          href={`/admin/productos/${producto._id.toString()}/editar`}
                          aria-label={`Editar ${producto.nombre}`}
                          className="font-semibold text-orange-700 hover:underline"
                        >
                          Editar
                        </Link>

                        <CambiarEstadoProducto
                          key={`${producto._id.toString()}-${producto.updatedAt?.toISOString() ?? "sin-fecha"}-${producto.activo !== false}`}
                          id={producto._id.toString()}
                          nombre={producto.nombre}
                          activo={producto.activo !== false}
                          actualizadoEn={producto.updatedAt?.toISOString() ?? null}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav
          aria-label="Páginas de productos"
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          {pagina > 1 && (
            <Link
              href={`/admin/productos?pagina=${pagina - 1}`}
              className="font-semibold text-orange-700 hover:underline"
            >
              Anterior
            </Link>
          )}

          <span>Página {pagina}</span>

          {haySiguiente && (
            <Link
              href={`/admin/productos?pagina=${pagina + 1}`}
              className="font-semibold text-orange-700 hover:underline"
            >
              Siguiente
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}