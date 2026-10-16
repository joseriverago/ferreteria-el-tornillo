import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true, //exige los campos obligatorios.
      trim: true, //elimina espacios al principio y al final del texto.
      minlength: 2, //limitan la longitud de los datos.
      maxlength: 100, //limitan la longitud de los datos.
    },
    correo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    telefono: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },
    asunto: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    estado: {
      type: String,
      enum: ["pendiente", "atendido"],
      default: "pendiente",
      required: true,
    },
  },
  {
    timestamps: true, //registra automáticamente las fechas de creación y actualización.
    collection: "mensajes_contacto",
  }
);

export type ContactMessageType = InferSchemaType<
  typeof ContactMessageSchema
>;

const ContactMessage =
  (models.ContactMessage as Model<ContactMessageType> | undefined) ?? //reutiliza el modelo si ya fue registrado, evitando redefinirlo durante las recargas del servidor.
  model<ContactMessageType>("ContactMessage", ContactMessageSchema);

export default ContactMessage;