import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";

export const runtime = "nodejs";

const ContactoSchema = z.object({
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
  telefono: z
    .string()
    .trim()
    .max(20, "El teléfono no puede superar los 20 caracteres.")
    .optional()
    .default(""),
  asunto: z
    .string()
    .trim()
    .min(3, "El asunto debe tener al menos 3 caracteres.")
    .max(150, "El asunto no puede superar los 150 caracteres."),
  mensaje: z
    .string()
    .trim()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(2000, "El mensaje no puede superar los 2000 caracteres."),
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

  const resultado = ContactoSchema.safeParse(datos);

  if (!resultado.success) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Revisa los datos del formulario.",
        errores: resultado.error.issues.map((error) => ({
          campo: error.path.join("."),
          mensaje: error.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    await ContactMessage.create({
      ...resultado.data,
      estado: "pendiente",
    });

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Tu mensaje fue recibido correctamente.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(
      "Error al guardar el mensaje de contacto:",
      error instanceof Error ? error.name : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No pudimos guardar tu mensaje. Inténtalo nuevamente.",
      },
      { status: 500 }
    );
  }
}