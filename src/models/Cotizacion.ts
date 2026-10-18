import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

// Conserva los datos del producto al enviar la cotización.
const ItemCotizacionSchema = new Schema(
  {
    producto: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    codigo: {
      type: String,
      required: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "La cantidad debe ser un número entero válido.",
      },
    },
    precioUnitarioCentimos: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "El precio debe expresarse en céntimos enteros.",
      },
    },
  },
  { _id: false }
);

const ClienteCotizacionSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    correo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const CotizacionSchema = new Schema(
  {
    usuario: { //Identifica al cliente propietario de la cotización.
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Conserva los datos del cliente al enviar la solicitud.
    cliente: {
      type: ClienteCotizacionSchema,
      required: true,
    },

    items: { //Guarda productos, cantidades y precios de referencia.
      type: [ItemCotizacionSchema],
      required: true,
      default: undefined,
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) &&
          items.length >= 1 &&
          items.length <= 100,
        message: "La cotización debe contener entre 1 y 100 productos.",
      },
    },

    totalCentimos: { //Guarda el total como entero: S/ 25,50 equivale a 2550.
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "El total debe expresarse en céntimos enteros.",
      },
    },

    estado: { //Permite distinguir solicitudes pendientes, atendidas o rechazadas.
      type: String,
      enum: ["pendiente", "atendida", "rechazada"],
      default: "pendiente",
      required: true,
    },

    observacion: { //Guarda un comentario opcional del cliente.
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "cotizaciones",
  }
);

// Facilita consultar primero las cotizaciones recientes de cada usuario.
CotizacionSchema.index({ usuario: 1, createdAt: -1 });

export type CotizacionType =
  InferSchemaType<typeof CotizacionSchema>;

const Cotizacion =
  (models.Cotizacion as Model<CotizacionType> | undefined) ??
  model<CotizacionType>("Cotizacion", CotizacionSchema);

export default Cotizacion;