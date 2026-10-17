import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { verificarPassword } from "@/lib/password";
import { crearSesion } from "@/lib/sesion";
import User from "@/models/User";

export const runtime = "nodejs";

const LoginSchema = z.object({
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo electrónico válido.")
    .max(254),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña.")
    .max(128, "La contraseña es demasiado larga."),
});

// Permite realizar la comprobación aunque el correo no exista.
// No corresponde a una cuenta y nunca permite iniciar sesión.
const HASH_NEUTRO =
  `scrypt$v1$${"0".repeat(32)}$${"0".repeat(128)}`;

export async function POST(request: Request) {
  // El formulario debe enviar la solicitud desde nuestro propio sitio.
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

  const tipoContenido = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();

  if (tipoContenido !== "application/json") {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "La solicitud debe enviarse en formato JSON.",
      },
      { status: 415 }
    );
  }

  let datos: unknown;

  try {
    datos = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "El cuerpo de la solicitud no es un JSON válido.",
      },
      { status: 400 }
    );
  }

  const resultado = LoginSchema.safeParse(datos);

  if (!resultado.success) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Revisa los datos de inicio de sesión.",
        errores: resultado.error.issues.map((error) => ({
          campo: error.path.join("."),
          mensaje: error.message,
        })),
      },
      { status: 400 }
    );
  }

  const { correo, password } = resultado.data;

  try {
    await connectDB();

    const usuario = await User.findOne({ correo })
      .select("+passwordHash");

    const passwordCorrecta = await verificarPassword(
      password,
      usuario?.passwordHash ?? HASH_NEUTRO
    );

    if (!usuario || !passwordCorrecta) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Correo o contraseña incorrectos.",
        },
        { status: 401 }
      );
    }

    await crearSesion(usuario._id.toString());

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Iniciaste sesión correctamente.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error(
      "Error al iniciar sesión:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No pudimos iniciar sesión. Inténtalo nuevamente.",
      },
      { status: 500 }
    );
  }
}

//Cómo funciona:
//1. Comprueba que la solicitud proceda del mismo sitio y contenga JSON.
//2. Valida el correo y la contraseña.
//3. Busca al usuario y obtiene expresamente passwordHash mediante .select("+passwordHash"), porque normalmente ese campo está oculto.
//4. Comprueba la contraseña con la función que ya probamos.
//5. Si las credenciales son correctas, crea la sesión y establece la cookie.