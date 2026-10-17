import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/sesion";
import FormularioLogin from "./FormularioLogin";

export default async function LoginPage() {
  const usuario = await obtenerUsuarioActual();

  if (usuario) {
    redirect("/");
  }

  return <FormularioLogin />;
}