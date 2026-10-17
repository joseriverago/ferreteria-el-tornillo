import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const UserSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    correo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true, //declara un índice único para el correo. Cuando implementemos el registro, también controlaremos el error que produce intentar guardar un correo repetido.
    },
    passwordHash: { //almacenará el resultado de aplicar una función de protección de contraseñas. Este modelo no transforma automáticamente la contraseña; esa operación la implementaremos antes de guardar al usuario.
      type: String,
      required: true,
      select: false,
    },
    rol: { //distingue clientes y administradores. El registro público asignará explícitamente "cliente" desde el servidor; el usuario no podrá elegir ser administrador.
      type: String,
      enum: ["cliente", "administrador"],
      default: "cliente",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "usuarios",
  }
);

export type UserType = InferSchemaType<typeof UserSchema>;

const User =
  (models.User as Model<UserType> | undefined) ??
  model<UserType>("User", UserSchema);

export default User;