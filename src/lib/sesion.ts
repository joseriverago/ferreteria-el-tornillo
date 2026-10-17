import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";

const NOMBRE_COOKIE = "ferreteria_sesion";
const DURACION_SEGUNDOS = 7 * 24 * 60 * 60;

function calcularTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function esTokenValido(token: string | undefined): token is string {
  return typeof token === "string" && /^[0-9a-f]{64}$/.test(token);
}

// Usar después de comprobar correctamente las credenciales.
export async function crearSesion(usuarioId: string): Promise<void> { //Genera un identificador aleatorio, guarda su hash en MongoDB y establece una cookie con duración de siete días.
  const almacenCookies = await cookies();
  const tokenAnterior = almacenCookies.get(NOMBRE_COOKIE)?.value;

  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(
    Date.now() + DURACION_SEGUNDOS * 1000
  );

  await connectDB();
  await Session.init();

  await Session.create({
    usuario: usuarioId,
    tokenHash: calcularTokenHash(token),
    expiraEn,
  });

  // Invalida la sesión anterior de este navegador, si existe.
  if (esTokenValido(tokenAnterior)) {
    await Session.deleteOne({
      tokenHash: calcularTokenHash(tokenAnterior),
    });
  }

  almacenCookies.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function obtenerUsuarioActual() { //Comprueba la cookie y la fecha de vencimiento; devuelve los datos del usuario o null si no hay una sesión válida.
  const almacenCookies = await cookies();
  const token = almacenCookies.get(NOMBRE_COOKIE)?.value;

  if (!esTokenValido(token)) {
    return null;
  }

  await connectDB();

  const sesion = await Session.findOne({
    tokenHash: calcularTokenHash(token),
    expiraEn: { $gt: new Date() },
  })
    .select("usuario")
    .lean();

  if (!sesion) {
    return null;
  }

  const usuario = await User.findById(sesion.usuario)
    .select("_id nombre correo rol")
    .lean();

  if (!usuario) {
    return null;
  }

  return {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}

export async function cerrarSesion(): Promise<void> { //Elimina la sesión de MongoDB y hace caducar la cookie del navegador.
  const almacenCookies = await cookies();
  const token = almacenCookies.get(NOMBRE_COOKIE)?.value;

  if (esTokenValido(token)) {
    await connectDB();

    await Session.deleteOne({
      tokenHash: calcularTokenHash(token),
    });
  }

  almacenCookies.set(NOMBRE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}