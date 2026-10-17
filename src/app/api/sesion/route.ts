import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usuario = await obtenerUsuarioActual();

    return NextResponse.json(
      {
        ok: true,
        autenticado: usuario !== null,
        usuario,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error(
      "Error al consultar la sesión:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No pudimos consultar tu sesión.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

//Esta ruta devuelve los datos del usuario asociado a la cookie. Si no existe una sesión válida, devuelve autenticado: false y usuario: null. no-store indica que la respuesta no debe almacenarse en caché.