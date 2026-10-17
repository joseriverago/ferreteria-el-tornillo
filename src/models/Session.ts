import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const SessionSchema = new Schema(
  {
    usuario: { //guarda el identificador de la cuenta a la que pertenece la sesión. ref: "User" hace referencia al nombre de nuestro modelo de usuario.
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { //guardará el hash del identificador aleatorio de sesión. Es distinto del hash de la contraseña.
      type: String,
      required: true,
      unique: true,
      select: false,
      match: /^[0-9a-f]{64}$/,
    },
    expiraEn: { //establece hasta cuándo será válida la sesión.
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, //añade las fechas de creación y actualización.
    collection: "sesiones",
  }
);

// Permite eliminar automáticamente las sesiones vencidas.
SessionSchema.index(
  { expiraEn: 1 },
  { expireAfterSeconds: 0 }
);

export type SessionType = InferSchemaType<typeof SessionSchema>;

const Session =
  (models.Session as Model<SessionType> | undefined) ??
  model<SessionType>("Session", SessionSchema);

export default Session;