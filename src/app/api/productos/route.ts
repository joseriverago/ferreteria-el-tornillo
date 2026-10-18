import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

//atiende la consulta cuando se abre /api/productos.
export async function GET() {
  try {
    await connectDB(); //establece o reutiliza la conexión con Atlas.

    const productos = await Product.find({ activo: { $ne: false } }) //consulta todos los documentos de products.
      .select(
        "codigo nombre categoria descripcion precio stock imagen marca"
      ) //selecciona los campos que devolveremos. _id también se incluye por defecto.
      .sort({ nombre: 1 }) //ordena los productos por nombre de forma ascendente.
      .lean(); //obtiene objetos simples para devolver los datos.

    return NextResponse.json({ //envía el resultado al navegador, incluyendo la cantidad de productos.
      ok: true,
      total: productos.length,
      productos,
    });
  } catch (error: unknown) { //controla un fallo y devuelve el estado HTTP 500.
    console.error(
      "Error al consultar productos:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No se pudieron obtener los productos.",
      },
      { status: 500 }
    );
  }
}