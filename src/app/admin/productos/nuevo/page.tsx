import Link from "next/link";
import { redirect } from "next/navigation";
import { verificarPermiso } from "@/lib/permisos";
import { CATEGORIAS } from "@/models/Product";
import FormularioProducto from "./FormularioProducto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const acceso = await verificarPermiso(["administrador"]);

  if (!acceso.permitido) {
    if (acceso.estado === 401) redirect("/login");
    redirect("/admin");
  }

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Crear producto</h1>

        <Link
          href="/admin/productos"
          className="mt-4 inline-block font-semibold text-orange-700 hover:underline"
        >
          Volver al listado
        </Link>

        <FormularioProducto categorias={CATEGORIAS} />
      </div>
    </main>
  );
}