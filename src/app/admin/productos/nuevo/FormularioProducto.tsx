"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";

type ProductoEditable = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  marca: string;
  descripcion: string;
  actualizadoEn: string | null;
};

const ExitoSchema = z.object({
  ok: z.literal(true),
  producto: z.object({
    codigo: z.string(),
    nombre: z.string(),
  }),
});

const ErrorSchema = z.object({
  mensaje: z.string(),
});

const campo =
  "mt-1 w-full rounded-lg border border-slate-300 p-3";

export default function FormularioProducto({
  categorias,
  producto,
}: {
  categorias: readonly string[];
  producto?: ProductoEditable;
}) {
  const bloqueo = useRef(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const [guardado, setGuardado] = useState<{
    codigo: string;
    nombre: string;
  } | null>(null);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (bloqueo.current || guardado) return;

    const datos = new FormData(event.currentTarget);
    const precio = String(datos.get("precio") ?? "");
    const stock = String(datos.get("stock") ?? "");

    bloqueo.current = true;
    setEnviando(true);
    setError("");

    try {
      const respuesta = await fetch(
        producto
          ? `/api/admin/productos/${producto.id}`
          : "/api/admin/productos",
        {
          method: producto ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(producto
              ? { actualizadoEn: producto.actualizadoEn }
              : { codigo: datos.get("codigo") }),
            nombre: datos.get("nombre"),
            categoria: datos.get("categoria"),
            precio: precio.trim() === "" ? null : Number(precio),
            stock: stock.trim() === "" ? null : Number(stock),
            marca: datos.get("marca"),
            descripcion: datos.get("descripcion"),
          }),
        }
      );

      const contenido: unknown = await respuesta.json();

      if (!respuesta.ok) {
        const detalle = ErrorSchema.safeParse(contenido);

        setError(
          detalle.success
            ? detalle.data.mensaje
            : "No pudimos guardar el producto."
        );

        return;
      }

      const resultado = ExitoSchema.safeParse(contenido);

      if (!resultado.success) {
        throw new Error("Respuesta inesperada.");
      }

      setGuardado(resultado.data.producto);
    } catch {
      setError(
        "No pudimos confirmar el resultado. Revisa los datos guardados antes de repetir el envío."
      );
    } finally {
      bloqueo.current = false;
      setEnviando(false);
    }
  }

  if (guardado) {
    return (
      <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
        <p role="status" className="font-semibold text-green-900">
          {producto ? "Producto actualizado" : "Producto creado"}:{" "}
          {guardado.nombre} ({guardado.codigo}).
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/catalogo/${encodeURIComponent(guardado.codigo)}`}
            className="font-semibold text-orange-700 underline"
          >
            Ver en catálogo
          </Link>

          <Link
            href="/admin/productos"
            className="font-semibold text-orange-700 underline"
          >
            Volver al listado
          </Link>

          {!producto && (
            <button
              type="button"
              onClick={() => {
                setGuardado(null);
                setError("");
              }}
              className="font-semibold underline"
            >
              Crear otro producto
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={guardar}
      onInput={() => setError("")}
      aria-busy={enviando}
      className="mt-6 rounded-xl border border-slate-200 bg-white p-6"
    >
      <fieldset
        disabled={enviando}
        className="grid gap-5 disabled:opacity-60"
      >
        <legend className="sr-only">Datos del producto</legend>

        <label className="block font-semibold">
          Código
          <input
            name="codigo"
            required
            minLength={2}
            maxLength={40}
            defaultValue={producto?.codigo ?? ""}
            readOnly={Boolean(producto)}
            className={campo}
          />
          <span className="mt-1 block text-sm font-normal text-slate-600">
            {producto
              ? "El código se conserva para mantener su enlace en el catálogo."
              : "Usa letras, números, guion o guion bajo. Se guardará en mayúsculas."}
          </span>
        </label>

        <label className="block font-semibold">
          Nombre
          <input
            name="nombre"
            required
            minLength={2}
            maxLength={150}
            defaultValue={producto?.nombre ?? ""}
            className={campo}
          />
        </label>

        <label className="block font-semibold">
          Categoría
          <select
            name="categoria"
            required
            defaultValue={producto?.categoria ?? ""}
            className={campo}
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>

            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </label>

        <label className="block font-semibold">
          Precio en soles
          <input
            name="precio"
            type="number"
            required
            min="0"
            max="999999.99"
            step="0.01"
            defaultValue={producto?.precio ?? ""}
            className={campo}
          />
        </label>

        <label className="block font-semibold">
          Stock
          <input
            name="stock"
            type="number"
            required
            min="0"
            max="1000000"
            step="1"
            defaultValue={producto?.stock ?? ""}
            className={campo}
          />
        </label>

        <label className="block font-semibold">
          Marca (opcional)
          <input
            name="marca"
            maxLength={100}
            defaultValue={producto?.marca ?? ""}
            className={campo}
          />
        </label>

        <label className="block font-semibold">
          Descripción (opcional)
          <textarea
            name="descripcion"
            maxLength={2000}
            rows={4}
            defaultValue={producto?.descripcion ?? ""}
            className={campo}
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800"
        >
          {enviando
            ? "Guardando..."
            : producto
              ? "Guardar cambios"
              : "Crear producto"}
        </button>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-4 text-red-700"
        >
          {error}
        </p>
      )}
    </form>
  );
}

//El formulario conserva la creación actual. Cuando recibe un producto, carga sus datos y cambia el botón a “Guardar cambios”.