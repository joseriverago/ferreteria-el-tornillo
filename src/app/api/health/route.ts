import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorConexion = Error & {
  code?: string | number;
  syscall?: string;
  cause?: {
    code?: string | number;
  };
};

export async function GET() {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("La conexión no tiene una base de datos disponible.");
    }

    await db.admin().ping();

    return NextResponse.json({
      ok: true,
      mensaje: "Conectado a MongoDB",
    });
  } catch (error: unknown) {
    const detalle =
      error instanceof Error ? (error as ErrorConexion) : null;

    console.error("Diagnóstico de MongoDB:", {
        tipo: detalle?.name ?? "Desconocido",
        codigo: detalle?.code ?? detalle?.cause?.code ?? "Sin código",
        operacion: detalle?.syscall ?? "No disponible",
        mensaje:
            detalle?.message?.replace(
            /mongodb(?:\+srv)?:\/\/\S+/gi,
            "[Cadena de conexión oculta]",
            ) ?? "Sin mensaje",
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          "No se pudo conectar a MongoDB. Revisa el diagnóstico en la terminal de VS Code.",
      },
      { status: 503 },
    );
  }
}