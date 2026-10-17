import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const LimiteAccesoSchema = new Schema(
  {
    clave: {
      type: String,
      required: true,
      unique: true,
    },

    // Cuenta únicamente las credenciales incorrectas.
    intentos: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Cuenta las comprobaciones que todavía no terminaron.
    enCurso: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    expiraEn: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "limites_acceso",
  }
);

LimiteAccesoSchema.index(
  { expiraEn: 1 },
  { expireAfterSeconds: 0 }
);

export type LimiteAccesoType =
  InferSchemaType<typeof LimiteAccesoSchema>;

const LimiteAcceso =
  (models.LimiteAcceso as Model<LimiteAccesoType> | undefined) ??
  model<LimiteAccesoType>("LimiteAcceso", LimiteAccesoSchema);

export default LimiteAcceso;