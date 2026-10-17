import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const LONGITUD_HASH = 64;

// Parámetros de la versión 1. No cambiarlos sin crear otra versión.
const OPCIONES_SCRYPT = {
  N: 131072,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
};

function derivarHash(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      LONGITUD_HASH,
      OPCIONES_SCRYPT,
      (error, hash) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(hash);
      }
    );
  });
}

export async function crearPasswordHash( //genera una sal: un valor aleatorio que se combina con la contraseña. Esto hace que dos cuentas con la misma contraseña tengan hashes diferentes.
  password: string
): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derivarHash(password, salt);

  return `scrypt$v1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verificarPassword( //calcula el hash de la contraseña ingresada usando la sal guardada y compara los resultados.
  password: string,
  passwordHash: string
): Promise<boolean> {
  const partes = passwordHash.split("$");

  if (partes.length !== 4) {
    return false;
  }

  const [algoritmo, version, saltHex, hashHex] = partes;

  if (algoritmo !== "scrypt" || version !== "v1") {
    return false;
  }

  if (
    !/^[0-9a-f]{32}$/.test(saltHex) ||
    !/^[0-9a-f]{128}$/.test(hashHex)
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const hashGuardado = Buffer.from(hashHex, "hex");
  const hashCalculado = await derivarHash(password, salt);

  return timingSafeEqual(hashGuardado, hashCalculado); //realiza la comparación de los hashes en tiempo constante.
}