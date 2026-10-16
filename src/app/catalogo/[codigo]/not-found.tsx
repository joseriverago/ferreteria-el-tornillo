import Link from "next/link";

export default function ProductoNoEncontrado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-10 text-slate-900">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-orange-700">
          Ferretería El Tornillo · 404
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Producto no encontrado
        </h1>

        <p className="mt-4 text-slate-600">
          No encontramos un producto con ese código.
          Puedes volver al catálogo y consultar los productos disponibles.
        </p>

        <Link
          href="/catalogo"
          className="mt-6 inline-block rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800"
        >
          Volver al catálogo
        </Link>
      </section>
    </main>
  );
}