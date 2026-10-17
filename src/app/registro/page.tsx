import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/sesion";
import FormularioRegistro from "./FormularioRegistro";

export default async function RegistroPage() {
  const usuario = await obtenerUsuarioActual();

  if (usuario) {
    redirect("/");
  }

  return <FormularioRegistro />;
}