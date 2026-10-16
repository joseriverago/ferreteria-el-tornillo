import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Product, { type ProductType } from "@/models/Product";
import AgregarAlCarrito from "@/components/AgregarAlCarrito";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const formatoPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default async function DetalleProductoPage({
  params,
}: {
  params: Promise<{ codigo: string }>; //recibe el código desde la dirección. 
}) {
  const { codigo } = await params;

  await connectDB();

  const producto: ProductType | null = await Product.findOne({ //busca un único producto en MongoDB. Tu modelo ya define ese código como único.
    codigo,
  }).lean();
  //ProductType | null: indica que la consulta puede devolver un producto o no encontrar ninguno.

  if (!producto) {
    notFound(); //muestra la página de producto no encontrado cuando no existe ese código.
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/catalogo"
          className="font-semibold text-orange-700 hover:underline"
        >
          ← Volver al catálogo
        </Link>

        <article className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">
            {producto.categoria}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {producto.nombre}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Código: {producto.codigo}
          </p>

          <p className="mt-6 text-slate-600">
            {producto.descripcion || "Sin descripción disponible."}
          </p>

          <p className="mt-4 text-slate-600">
            Marca: {producto.marca || "Sin especificar"}
          </p>

          <p className="mt-8 text-3xl font-bold">
            {formatoPrecio.format(producto.precio)}
          </p>

          {producto.stock > 0 ? (
            <p className="mt-3 font-medium text-green-700">
              Disponible: {producto.stock} unidades
            </p>
          ) : (
            <p className="mt-3 font-medium text-red-700">
              Sin stock
            </p>
          )}
          <AgregarAlCarrito
            producto={{
              codigo: producto.codigo,
              nombre: producto.nombre,
              precio: producto.precio,
              stock: producto.stock,
            }}
          />
        </article>
      </div>
    </main>
  );
}