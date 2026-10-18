import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { verificarPermiso } from "@/lib/permisos";
import Cotizacion from "@/models/Cotizacion";

export const runtime = "nodejs";

const CambioSchema = z.object({
  estado: z.enum(["atendida", "rechazada"]),
}).strict();

type Contexto = {
  params: Promise<{ id: string }>;
};

function rechazar(mensaje: string, status: number) {
  return NextResponse.json(
    { ok: false, mensaje },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request, { params }: Contexto) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return rechazar("Origen de la solicitud no permitido.", 403);
  }

  const tipo = request.headers.get("content-type")
    ?.split(";")[0].trim().toLowerCase();

  if (tipo !== "application/json") {
    return rechazar("La solicitud debe enviarse en formato JSON.", 415);
  }

  try {
    const acceso = await verificarPermiso(["administrador"]);

    if (!acceso.permitido) {
      return rechazar(acceso.mensaje, acceso.estado);
    }

    const { id } = await params;

    if (!/^[0-9a-f]{24}$/i.test(id)) {
      return rechazar("Identificador de cotización inválido.", 400);
    }

    let datos: unknown;

    try {
      datos = await request.json();
    } catch {
      return rechazar("El contenido no es un JSON válido.", 400);
    }

    const resultado = CambioSchema.safeParse(datos);

    if (!resultado.success) {
      return rechazar(
        "Indica únicamente el estado atendida o rechazada.",
        400
      );
    }

    await connectDB();

    // La comprobación y el cambio ocurren en una sola operación.
    const cotizacion = await Cotizacion.findOneAndUpdate(
      { _id: id, estado: "pendiente" }, //evita sobrescribir una cotización ya procesada, incluso si llegan dos peticiones simultáneas. Este cambio no descuenta stock ni genera cobros.
      { $set: { estado: resultado.data.estado } },
      { returnDocument: "after", runValidators: true }
    ).select("_id estado").lean();

    if (!cotizacion) {
      const existe = await Cotizacion.exists({ _id: id });

      return existe
        ? rechazar(
            "Esta cotización ya fue procesada. Actualiza la lista.",
            409
          )
        : rechazar("La cotización no existe.", 404);
    }

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Estado actualizado correctamente.",
        cotizacion: {
          id: cotizacion._id.toString(),
          estado: cotizacion.estado,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error(
      "Error al actualizar cotización:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return rechazar("No pudimos actualizar la cotización.", 500);
  }
}