import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { verificarPermiso } from "@/lib/permisos";
import Product, { CATEGORIAS } from "@/models/Product";

export const runtime = "nodejs";

const ProductoSchema = z.object({
  codigo: z.string().trim().toUpperCase().regex(
    /^[A-Z0-9][A-Z0-9_-]{1,39}$/,
    "El código debe tener entre 2 y 40 caracteres: letras, números, guion o guion bajo."
  ),
  nombre: z.string().trim().min(2).max(150),
  categoria: z.enum(CATEGORIAS),
  precio: z.number().min(0).max(999999.99).multipleOf(0.01),
  stock: z.number().int().min(0).max(1000000),
  descripcion: z.string().trim().max(2000).optional().default(""),
  marca: z.string().trim().max(100).optional().default(""),
}).strict();

function rechazar(mensaje: string, status: number) {
  return NextResponse.json(
    { ok: false, mensaje },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
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

    let datos: unknown;

    try {
      datos = await request.json();
    } catch {
      return rechazar("El contenido no es un JSON válido.", 400);
    }

    const resultado = ProductoSchema.safeParse(datos);

    if (!resultado.success) {
      return rechazar(
        "Revisa los datos: código de 2 a 40 caracteres, nombre de 2 a 150, categoría válida, precio de 0 a 999999.99 con hasta dos decimales y stock entero de 0 a 1000000. Marca: máximo 100 caracteres; descripción: máximo 2000.",
        400
      );
    }

    await connectDB();
    await Product.init();

    const producto = await Product.create(resultado.data);

    return NextResponse.json(
      {
        ok: true,
        producto: {
          codigo: producto.codigo,
          nombre: producto.nombre,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return rechazar("Ya existe un producto con ese código.", 409);
    }

    console.error(
      "Error al crear producto:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return rechazar("No pudimos crear el producto.", 500);
  }
}