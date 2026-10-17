import { NextResponse } from "next/server";
import { cerrarSesion } from "@/lib/sesion";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origen = request.headers.get("origin");

  if (origen !== new URL(request.url).origin) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Origen de la solicitud no permitido.",
      },
      { status: 403 }
    );
  }

  try {
    await cerrarSesion();

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Cerraste sesión correctamente.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error(
      "Error al cerrar sesión:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No pudimos cerrar tu sesión. Inténtalo nuevamente.",
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

//El cierre utiliza POST porque modifica el estado: elimina la sesión de MongoDB y hace caducar la cookie. La cuenta del usuario permanece guardada.