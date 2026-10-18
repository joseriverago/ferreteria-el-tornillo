import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { verificarPermiso } from "@/lib/permisos";
import Cotizacion from "@/models/Cotizacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAMANO_PAGINA = 10;

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const fecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

const estados = {
  pendiente: "Pendiente de atención",
  atendida: "Atendida",
  rechazada: "Rechazada",
};

type Props = {
  searchParams: Promise<{ pagina?: string | string[] }>;
};

export default async function MisCotizacionesPage({ searchParams }: Props) {
  const acceso = await verificarPermiso(["cliente"]);

  if (!acceso.permitido) {
    if (acceso.estado === 401) redirect("/login");
    redirect("/admin");
  }

  const parametros = await searchParams;

  const pagina =
    typeof parametros.pagina === "string" &&
    /^[1-9]\d{0,4}$/.test(parametros.pagina)
      ? Number(parametros.pagina)
      : 1;

  await connectDB();

  // El propietario se obtiene de la sesión, no de la URL.
  const resultados = await Cotizacion.find({
    usuario: acceso.usuario.id,
  })
    .select("_id items totalCentimos estado observacion createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .skip((pagina - 1) * TAMANO_PAGINA)
    .limit(TAMANO_PAGINA + 1)
    .lean();

  const haySiguiente = resultados.length > TAMANO_PAGINA;
  const cotizaciones = resultados.slice(0, TAMANO_PAGINA);

  return (
    <main className="flex-1 bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Mis cotizaciones</h1>

        <p className="mt-2 text-slate-600">
          Consulta tus solicitudes, ordenadas desde la más reciente.
        </p>

        <Link
          href="/carrito"
          className="mt-4 inline-block font-semibold text-orange-700 hover:underline"
        >
          Volver al carrito
        </Link>

        {cotizaciones.length === 0 ? (
          <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            {pagina === 1
              ? "Todavía no tienes cotizaciones registradas."
              : "No hay cotizaciones en esta página."}
          </p>
        ) : (
          <ul className="mt-6 space-y-6">
            {cotizaciones.map((cotizacion) => (
              <li
                key={cotizacion._id.toString()}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="break-all text-lg font-bold">
                  Solicitud {cotizacion._id.toString()}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  <time dateTime={cotizacion.createdAt.toISOString()}>
                    {fecha.format(cotizacion.createdAt)}
                  </time>
                </p>

                <p className="mt-2 font-semibold">
                  Estado: {estados[cotizacion.estado]}
                </p>

                <ul className="mt-4 space-y-3">
                  {cotizacion.items.map((item) => (
                    <li
                      key={item.codigo}
                      className="border-t border-slate-100 pt-3"
                    >
                      <p className="font-semibold">{item.nombre}</p>

                      <p className="text-sm text-slate-600">
                        Código: {item.codigo}
                      </p>

                      <p>
                        {item.cantidad} ×{" "}
                        {moneda.format(item.precioUnitarioCentimos / 100)}
                        {" = "}
                        {moneda.format(
                          (item.cantidad * item.precioUnitarioCentimos) / 100
                        )}
                      </p>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-xl font-bold">
                  Total estimado:{" "}
                  {moneda.format(cotizacion.totalCentimos / 100)}
                </p>

                {cotizacion.observacion && (
                  <p className="mt-3 whitespace-pre-wrap wrap-break-word text-slate-600">
                    Observación: {cotizacion.observacion}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <nav
          aria-label="Páginas de cotizaciones"
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          {pagina > 1 && (
            <Link
              href={`/mis-cotizaciones?pagina=${pagina - 1}`}
              className="font-semibold text-orange-700 hover:underline"
            >
              Anterior
            </Link>
          )}

          <span>Página {pagina}</span>

          {haySiguiente && (
            <Link
              href={`/mis-cotizaciones?pagina=${pagina + 1}`}
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