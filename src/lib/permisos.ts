import { obtenerUsuarioActual } from "@/lib/sesion";

type Rol = "cliente" | "administrador";

type UsuarioSesion = NonNullable<
  Awaited<ReturnType<typeof obtenerUsuarioActual>>
>;

type ResultadoPermiso =
  | {
      permitido: true;
      usuario: UsuarioSesion;
    }
  | {
      permitido: false;
      estado: 401 | 403;
      mensaje: string;
    };

// Utilizar únicamente desde código del servidor.
export async function verificarPermiso(
  rolesPermitidos: readonly Rol[]
): Promise<ResultadoPermiso> {
  const usuario = await obtenerUsuarioActual();

  // No existe una sesión válida.
  if (!usuario) {
    return {
      permitido: false,
      estado: 401,
      mensaje: "Debes iniciar sesión para continuar.",
    };
  }

  const tienePermiso = rolesPermitidos.some(
    (rol) => rol === usuario.rol
  );

  // Existe sesión, pero el rol no tiene autorización.
  if (!tienePermiso) {
    return {
      permitido: false,
      estado: 403,
      mensaje: "Tu cuenta no tiene permiso para acceder a esta sección.",
    };
  }

  return {
    permitido: true,
    usuario,
  };
}