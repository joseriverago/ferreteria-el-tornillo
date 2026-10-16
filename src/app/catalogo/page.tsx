import type { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Product, { CATEGORIAS } from "@/models/Product";
import Link from "next/link";
import Form from "next/form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductoCatalogo = { //describe para TypeScript los campos que utilizaremos en pantalla. No crea otra colección.
  _id: Types.ObjectId;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  precio: number;
  stock: number;
  marca?: string;
};

const formatoPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    categoria?: string | string[];
  }>;
}) {
  const parametros = await searchParams;

  const valorBusqueda = Array.isArray(parametros.q)
    ? parametros.q[0]
    : parametros.q;

  const busqueda = (valorBusqueda ?? "").trim().slice(0, 80);

  const valorCategoria = Array.isArray(parametros.categoria)
    ? parametros.categoria[0]
    : parametros.categoria;

  const categoria =
    CATEGORIAS.find((opcion) => opcion === valorCategoria) ?? ""; //comprueba que la categoría recibida pertenezca a nuestra lista. Una categoría desconocida se ignora.

  const textoEscapado = busqueda.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const filtro = {
    ...(busqueda
      ? {
          $or: [
            { nombre: { $regex: textoEscapado, $options: "i" } },
            { codigo: { $regex: textoEscapado, $options: "i" } },
          ],
        }
      : {}),
    ...(categoria ? { categoria } : {}),
  };

  await connectDB();

  const productos: ProductoCatalogo[] = await Product.find(filtro)
    .sort({ nombre: 1 })
    .lean();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="font-semibold text-orange-700">
            Ferretería El Tornillo
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Catálogo de productos
          </h1>

          <p className="mt-2 text-slate-600">
            Consulta nuestros productos, precios y disponibilidad.
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Productos encontrados: {productos.length}
          </p>
        </header>

        <Form
          action="/catalogo"
          className="mb-8 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="mb-4">
            <label
              htmlFor="categoria"
              className="mb-2 block text-sm font-semibold"
            >
              Categoría
            </label>

            <select
              key={`categoria-${categoria}`}
              id="categoria"
              name="categoria" //incorpora la selección a la URL al enviar el formulario.
              defaultValue={categoria} //conserva la categoría seleccionada al mostrar los resultados.
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Todas las categorías</option> 

              {CATEGORIAS.map((opcion) => ( //genera una opción para cada categoría
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>

          <label
            htmlFor="busqueda"
            className="mb-2 block text-sm font-semibold"
          >
            Buscar por nombre o código
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              key={`busqueda-${busqueda}`}
              id="busqueda"
              name="q"
              type="search"
              defaultValue={busqueda} //mantiene el texto buscado en el campo.
              maxLength={80}
              placeholder="Ejemplo: martillo o HM-001"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />

            <button
              type="submit"
              className="rounded-lg bg-orange-700 px-6 py-2 font-semibold text-white hover:bg-orange-800"
            >
              Buscar
            </button>

            <Link
              href="/catalogo"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center hover:bg-slate-100"
            >
              Limpiar filtros
            </Link>
          </div>
        </Form>

        {productos.length === 0 ? (
          <p className="rounded-xl bg-white p-6">
            {busqueda || categoria
              ? "No se encontraron productos con los filtros seleccionados."
              : "Todavía no hay productos registrados."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto) => ( //genera una tarjeta por cada producto.
              <article
                key={producto._id.toString()} //proporciona a React un identificador único para cada tarjeta.
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-orange-700">
                  {producto.categoria}
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  {producto.nombre}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Código: {producto.codigo}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  {producto.descripcion}
                </p>

                <p className="mt-3 text-sm text-slate-500">
                  Marca: {producto.marca || "Sin especificar"}
                </p>

                <div className="mt-auto pt-6">
                  <p className="text-2xl font-bold">
                    {formatoPrecio.format(producto.precio)} 
                  </p>

                  {producto.stock > 0 ? (
                    <p className="mt-2 font-medium text-green-700">
                      Disponible: {producto.stock} unidades
                    </p>
                  ) : (
                    <p className="mt-2 font-medium text-red-700">
                      Sin stock
                    </p>
                  )}
                  <Link
                    href={`/catalogo/${encodeURIComponent(producto.codigo)}`}
                    className="mt-4 inline-block rounded-lg bg-orange-700 px-5 py-2 font-semibold text-white hover:bg-orange-800"
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>  
    </main>
  );
} 