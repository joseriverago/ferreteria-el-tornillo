import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { crearPasswordHash } from "@/lib/password";
import User from "@/models/User";

export const runtime = "nodejs";

const RegistroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo electrónico válido.")
    .max(254, "El correo es demasiado largo."),
  password: z
    .string()
    .min(15, "La contraseña debe tener al menos 15 caracteres.")
    .max(128, "La contraseña no puede superar los 128 caracteres."),
});

export async function POST(request: Request) {
  let datos: unknown;

  try {
    datos = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "El cuerpo de la solicitud debe ser un JSON válido.",
      },
      { status: 400 }
    );
  }

  const resultado = RegistroSchema.safeParse(datos);

  if (!resultado.success) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Revisa los datos del registro.",
        errores: resultado.error.issues.map((error) => ({
          campo: error.path.join("."),
          mensaje: error.message,
        })),
      },
      { status: 400 }
    );
  }

  const { nombre, correo, password } = resultado.data;

  try {
    await connectDB();

    // Espera a que el modelo y sus índices estén preparados.
    await User.init();

    const existente = await User.exists({ correo });

    if (existente) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Ya existe una cuenta con ese correo.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await crearPasswordHash(password);

    await User.create({
      nombre,
      correo,
      passwordHash,
      rol: "cliente",
    });

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Tu cuenta fue creada correctamente.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // También controla registros simultáneos con el mismo correo.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Ya existe una cuenta con ese correo.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Error al registrar usuario:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No pudimos crear tu cuenta. Inténtalo nuevamente.",
      },
      { status: 500 }
    );
  }
}

//Qué hace esta ruta:
//- Valida nombre, correo y contraseña.
//- Normaliza el correo a minúsculas y comprueba si ya existe.
//- Genera el hash antes de guardar la cuenta.
//- signa el rol cliente desde el servidor.
//- Devuelve una confirmación sin incluir la contraseña ni el hash.