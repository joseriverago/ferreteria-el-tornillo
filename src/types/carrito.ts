export type ProductoCarrito = {
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
};

export type ItemCarrito = ProductoCarrito & {
  cantidad: number;
};
//ProductoCarrito representa los datos que necesitamos de un producto.
//ItemCarrito agrega la cantidad solicitad