import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-slate-100 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-3xl">
          <p className="font-semibold text-orange-700">
            Ferretería El Tornillo
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight">
            Encuentra los productos para tu próximo proyecto
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Explora nuestras categorías, consulta precios y
            disponibilidad, y selecciona los productos que necesitas
            para preparar tu cotización.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/catalogo"
              className="rounded-lg bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800"
            >
              Explorar catálogo
            </Link>

            <Link
              href="/carrito"
              className="rounded-lg border border-orange-700 px-6 py-3 font-semibold text-orange-700 hover:bg-orange-50"
            >
              Revisar mi carrito
            </Link>
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">
            Prepara tu selección
          </h2>

          <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-600">
            <li>Busca productos por nombre, código o categoría.</li>
            <li>Consulta sus detalles y añade las unidades que necesitas.</li>
            <li>Revisa las cantidades y el total estimado en tu carrito.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}