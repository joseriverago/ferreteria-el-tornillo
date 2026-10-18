import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { verificarPermiso } from "@/lib/permisos";
import Product from "@/models/Product";
import Cotizacion from "@/models/Cotizacion";

export const runtime = "nodejs";

const SolicitudSchema = z.object({
  items: z.array(
    z.object({
      codigo: z.string().trim().min(1).max(100),
      cantidad: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
    }).strict()
  ).min(1).max(100),
  observacion: z.string().trim().max(1000).optional().default(""),
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

  const tipoContenido = request.headers.get("content-type")
    ?.split(";")[0].trim().toLowerCase();

  if (tipoContenido !== "application/json") {
    return rechazar("La solicitud debe enviarse en formato JSON.", 415);
  }

  try {
    const acceso = await verificarPermiso(["cliente"]);

    if (!acceso.permitido) {
      return rechazar(acceso.mensaje, acceso.estado);
    }

    let datos: unknown;

    try {
      datos = await request.json();
    } catch {
      return rechazar("El contenido de la solicitud no es válido.", 400);
    }

    const resultado = SolicitudSchema.safeParse(datos);

    if (!resultado.success) {
      return rechazar(
        "Envía entre 1 y 100 productos con código y cantidad entera positiva. La observación admite hasta 1000 caracteres.",
        400
      );
    }

    const { items: seleccion, observacion } = resultado.data;
    const codigos = seleccion.map((item) => item.codigo);

    if (new Set(codigos).size !== codigos.length) {
      return rechazar("Cada producto debe aparecer una sola vez.", 400);
    }

    await connectDB();

    const productos = await Product.find({
      codigo: { $in: codigos },
      activo: { $ne: false },
    }).select("_id codigo nombre precio stock").lean();

    const porCodigo = new Map(
      productos.map((producto) => [producto.codigo, producto])
    );

    const items = [];
    let totalCentimos = 0;

    for (const seleccionado of seleccion) {
      const producto = porCodigo.get(seleccionado.codigo);

      if (!producto) {
        return rechazar(
          `El producto ${seleccionado.codigo} ya no está disponible. Revisa tu carrito.`,
          409
        );
      }

      if (!Number.isSafeInteger(producto.stock) || producto.stock < 0) {
        throw new Error("Stock inválido en el catálogo.");
      }

      if (seleccionado.cantidad > producto.stock) {
        return rechazar(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}.`,
          409
        );
      }

      if (!Number.isFinite(producto.precio) || producto.precio < 0) {
        throw new Error("Precio inválido en el catálogo.");
      }

      const precioUnitarioCentimos = Math.round(producto.precio * 100);
      const subtotal = precioUnitarioCentimos * seleccionado.cantidad;
      const nuevoTotal = totalCentimos + subtotal;

      if (
        !Number.isSafeInteger(precioUnitarioCentimos) ||
        !Number.isSafeInteger(subtotal) ||
        !Number.isSafeInteger(nuevoTotal)
      ) {
        return rechazar(
          "El importe de la solicitud supera el límite admitido.",
          400
        );
      }

      items.push({
        producto: producto._id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad: seleccionado.cantidad,
        precioUnitarioCentimos,
      });

      totalCentimos = nuevoTotal;
    }

    const cotizacion = await Cotizacion.create({
      usuario: acceso.usuario.id,
      cliente: {
        nombre: acceso.usuario.nombre,
        correo: acceso.usuario.correo,
      },
      items,
      totalCentimos,
      observacion,
      estado: "pendiente",
    });

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Tu solicitud de cotización fue enviada correctamente.",
        cotizacion: {
          id: cotizacion._id.toString(),
          totalCentimos: cotizacion.totalCentimos,
          estado: cotizacion.estado,
        },
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: unknown) {
    console.error(
      "Error al enviar la cotización:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return rechazar(
      "No pudimos guardar tu cotización. Inténtalo nuevamente.",
      500
    );
  }
}