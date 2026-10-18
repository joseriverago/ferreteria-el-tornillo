import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { verificarPermiso } from "@/lib/permisos";
import Product, { CATEGORIAS } from "@/models/Product";
import FormularioProducto from "../../nuevo/FormularioProducto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const acceso = await verificarPermiso(["administrador"]);

  if (!acceso.permitido) {
    if (acceso.estado === 401) redirect("/login");
    redirect("/admin");
  }

  const { id } = await params;

  if (!/^[0-9a-f]{24}$/i.test(id)) {
    notFound();
  }

  await connectDB();

  const producto = await Product.findById(id)
    .select(
      "codigo nombre categoria precio stock marca descripcion updatedAt"
    )
    .lean();

  if (!producto) {
    notFound();
  }

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Editar producto</h1>

        <Link
          href="/admin/productos"
          className="mt-4 inline-block font-semibold text-orange-700 hover:underline"
        >
          Volver al listado
        </Link>

        <FormularioProducto
          categorias={CATEGORIAS}
          producto={{
            id: producto._id.toString(),
            codigo: producto.codigo,
            nombre: producto.nombre,
            categoria: producto.categoria,
            precio: producto.precio,
            stock: producto.stock,
            marca: producto.marca ?? "",
            descripcion: producto.descripcion ?? "",
            actualizadoEn: producto.updatedAt?.toISOString() ?? null,
          }}
        />
      </div>
    </main>
  );
}