"use client"; //permite utilizar el estado interactivo de React.

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";

import type {
  ItemCarrito,
  ProductoCarrito,
} from "@/types/carrito";

import { useCarritoPersistente } from "@/lib/carrito-storage";

type CarritoContextType = {
  sincronizarCatalogo: (productos: ProductoCarrito[]) => void;
  items: ItemCarrito[]; //guarda los productos seleccionados.
  agregarProducto: (producto: ProductoCarrito) => void;
  actualizarCantidad: (codigo: string, cantidad: number) => void;
  eliminarProducto: (codigo: string) => void;
  totalUnidades: number;
};

const CarritoContext = createContext<CarritoContextType | null>(null);

export function CarritoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useCarritoPersistente();
  const sincronizarCatalogo = useCallback(
    (productos: ProductoCarrito[]) => {
      const porCodigo = new Map(
        productos.map((producto) => [producto.codigo, producto])
      );

      setItems((actuales) =>
        actuales.map((item) => {
          const producto = porCodigo.get(item.codigo);

          if (!producto) {
            return { ...item, stock: 0 };
          }

          return {
            ...item,
            nombre: producto.nombre,
            precio: producto.precio,
            stock: producto.stock,
          };
        })
      );
    },
    [setItems]
  );

  function agregarProducto(producto: ProductoCarrito) { //añade una unidad. Si el producto ya existe, aumenta su cantidad sin duplicar la fila.
    if (producto.stock <= 0) {
      return;
    }

    setItems((actuales) => {
      const existente = actuales.find(
        (item) => item.codigo === producto.codigo
      );

      if (existente) {
        return actuales.map((item) =>
          item.codigo === producto.codigo
            ? {
                ...item,
                ...producto,
                cantidad: Math.min( //limita la cantidad al stock recibido.
                  item.cantidad + 1,
                  producto.stock
                ),
              }
            : item
        );
      }

      return [...actuales, { ...producto, cantidad: 1 }];
    });
  }

  function actualizarCantidad(codigo: string, cantidad: number) { //acepta cantidades enteras desde 1 hasta el stock guardado en el carrito.
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return;
    }

    setItems((actuales) =>
      actuales.map((item) => {
        if (item.codigo !== codigo) {
          return item;
        }

        if (cantidad > item.stock && cantidad >= item.cantidad) {
          return item;
        }

        return { ...item, cantidad };
      })
    );
  }

  function eliminarProducto(codigo: string) { //conserva todos los productos excepto el que coincide con el código recibido.
    setItems((actuales) =>
      actuales.filter((item) => item.codigo !== codigo)
    );
  }
  
  const totalUnidades = items.reduce( //suma las cantidades: dos martillos y un foco cuentan como tres unidades.
    (total, item) => total + item.cantidad,
    0
  );

  return (
    <CarritoContext.Provider
      value={{
        items,
        agregarProducto,
        actualizarCantidad,
        eliminarProducto,
        totalUnidades,
        sincronizarCatalogo,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() { //permitirá que los futuros botones y la página del carrito accedan a estos datos.
  const contexto = useContext(CarritoContext); 

  if (!contexto) {
    throw new Error(
      "useCarrito debe utilizarse dentro de CarritoProvider."
    );
  }

  return contexto;
}