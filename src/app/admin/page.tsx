import Link from "next/link";
import { redirect } from "next/navigation";
import { verificarPermiso } from "@/lib/permisos";

export default async function AdminPage() {
  const acceso = await verificarPermiso(["administrador"]);

  if (!acceso.permitido) {
    if (acceso.estado === 401) {
      redirect("/login");
    }

    return (
      <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">
            Acceso restringido
          </h1>

          <p className="mt-4 text-slate-600">
            {acceso.mensaje}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">
          Panel de administración
        </h1>

        <p className="mt-4 text-slate-600">
          Bienvenido, {acceso.usuario.nombre}.
        </p>
        <Link
          href="/admin/cotizaciones"
          className="mt-6 block rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-orange-700"
        >
          <h2 className="text-xl font-bold text-orange-700">
            Cotizaciones recibidas
          </h2>

          <p className="mt-2 text-slate-600">
            Consulta las solicitudes de los clientes y su estado de atención.
          </p>
        </Link>
        <Link
          href="/admin/productos"
          className="mt-6 block rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-orange-700"
        >
          <h2 className="text-xl font-bold text-orange-700">
            Productos
          </h2>

          <p className="mt-2 text-slate-600">
            Consulta los productos del catálogo, sus precios y existencias.
          </p>
        </Link>
      </div>
    </main> 
  );
}