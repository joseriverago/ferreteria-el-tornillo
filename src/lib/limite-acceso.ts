import { createHash } from "node:crypto";
import { connectDB } from "@/lib/mongodb";
import LimiteAcceso from "@/models/LimiteAcceso";

const MAX_FALLOS = 5;
const DURACION_BLOQUE_MS = 15 * 60 * 1000;

type ResultadoAcceso<T> =
  | { estado: "correcto"; usuario: T }
  | { estado: "incorrecto" }
  | {
      estado: "limitado";
      reintentarEnSegundos: number;
      comprobacionesEnCurso: boolean;
    };

export async function verificarConLimite<T>(
  correo: string,
  verificar: () => Promise<T | null>
): Promise<ResultadoAcceso<T>> {
  await connectDB();
  await LimiteAcceso.init();

  const bloque = Math.floor(Date.now() / DURACION_BLOQUE_MS);
  const expiraEn = new Date(
    (bloque + 1) * DURACION_BLOQUE_MS
  );

  // La nueva versión separa estos contadores de los anteriores.
  const clave = createHash("sha256")
    .update(`login-fallos-v2:${correo.trim().toLowerCase()}:${bloque}`)
    .digest("hex");

  // Crea el contador si todavía no existe.
  try {
    await LimiteAcceso.updateOne(
      { clave },
      {
        $setOnInsert: {
          intentos: 0,
          enCurso: 0,
          expiraEn,
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: false,
      }
    );
  } catch (error: unknown) {
    // Otra solicitud pudo crear el mismo contador.
    const duplicado =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000;

    if (!duplicado) {
      throw error;
    }
  }

  // Reserva una comprobación sin superar el límite,
  // incluyendo las comprobaciones que aún no terminaron.
  const reserva = await LimiteAcceso.findOneAndUpdate(
    {
      clave,
      $expr: {
        $lt: [
          { $add: ["$intentos", "$enCurso"] },
          MAX_FALLOS,
        ],
      },
    },
    {
      $inc: { enCurso: 1 },
    },
    {
      returnDocument: "after",
    }
  )
    .lean()
    .exec();

  if (!reserva) {
    const contador = await LimiteAcceso.findOne({ clave })
      .select("intentos")
      .lean();

    if (!contador) {
      throw new Error("No se pudo consultar el límite de acceso.");
    }

    const bloqueado = contador.intentos >= MAX_FALLOS;

    return {
      estado: "limitado",
      comprobacionesEnCurso: !bloqueado,
      reintentarEnSegundos: bloqueado
        ? Math.max(
            1,
            Math.ceil((expiraEn.getTime() - Date.now()) / 1000)
          )
        : 1,
    };
  }

  let credencialesIncorrectas = false;

  try {
    const usuario = await verificar();

    credencialesIncorrectas = usuario === null;

    if (usuario === null) {
      return { estado: "incorrecto" };
    }

    return { estado: "correcto", usuario };
  } finally {
    // Libera la reserva incluso si ocurre un error.
    // Solo aumenta los fallos si la comprobación fue incorrecta.
    await LimiteAcceso.updateOne(
      {
        clave,
        enCurso: { $gt: 0 },
      },
      {
        $inc: {
          enCurso: -1,
          intentos: credencialesIncorrectas ? 1 : 0,
        },
      }
    );
  }
}