import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { verificarPermiso } from "@/lib/permisos";
import Product, { CATEGORIAS } from "@/models/Product";

export const runtime = "nodejs";

const EdicionSchema = z
  .object({
    nombre: z.string().trim().min(2).max(150),
    categoria: z.enum(CATEGORIAS),
    precio: z.number().min(0).max(999999.99).multipleOf(0.01),
    stock: z.number().int().min(0).max(1000000),
    marca: z.string().trim().max(100),
    descripcion: z.string().trim().max(2000),
    actualizadoEn: z.string().datetime({ precision: 3 }).nullable(),
  })
  .strict();

const EstadoSchema = z
  .object({
    activo: z.boolean(),
    actualizadoEn: z.string().datetime({ precision: 3 }).nullable(),
  })
  .strict();

const ActualizacionSchema = z.union([
  EdicionSchema,
  EstadoSchema,
]);

type Contexto = {
  params: Promise<{ id: string }>;
};

function rechazar(mensaje: string, status: number) {
  return NextResponse.json(
    { ok: false, mensaje },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function PATCH(request: Request, { params }: Contexto) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return rechazar("Origen de la solicitud no permitido.", 403);
  }

  const tipo = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();

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
      return rechazar("Identificador de producto inválido.", 400);
    }

    let datos: unknown;

    try {
      datos = await request.json();
    } catch {
      return rechazar("El contenido no es un JSON válido.", 400);
    }

    const resultado = ActualizacionSchema.safeParse(datos);

    if (!resultado.success) {
      return rechazar(
        "Los datos de actualización no son válidos. Revisa el formulario o recarga la página.",
        400
      );
    }

    const { actualizadoEn, ...campos } = resultado.data;

    const anterior =
      actualizadoEn === null ? null : new Date(actualizadoEn);

    const nuevaFecha = new Date(
      Math.max(Date.now(), (anterior?.getTime() ?? 0) + 1)
    );

    await connectDB();

    const producto = await Product.findOneAndUpdate(
      {
        _id: id,
        updatedAt: anterior,
      },
      {
        $set: {
          ...campos,
          updatedAt: nuevaFecha,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
        timestamps: false,
      }
    )
      .select("codigo nombre")
      .lean();

    if (!producto) {
      const existe = await Product.exists({ _id: id });

      return existe
        ? rechazar(
            "El producto cambió desde que cargaste los datos. Actualiza la lista o recarga el formulario antes de continuar.",
            409
          )
        : rechazar("El producto ya no existe.", 404);
    }

    return NextResponse.json(
      {
        ok: true,
        producto: {
          codigo: producto.codigo,
          nombre: producto.nombre,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: unknown) {
    console.error(
      "Error al editar producto:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return rechazar("No pudimos actualizar el producto.", 500);
  }
}
//La API comprueba el permiso de administrador y valida los datos. Además, compara la fecha de actualización: 
//si alguien modificó el producto después de abrir tu formulario, te pedirá recargar antes de guardar.