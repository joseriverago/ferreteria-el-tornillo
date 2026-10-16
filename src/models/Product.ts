import { Schema, models, model, InferSchemaType } from "mongoose";

export const CATEGORIAS = [
    "Herramientas manuales",
    "Herramientas eléctricas",
    "Electricidad",
    "Gasfitería",
    "Pinturas",
    "Construcción",
] as const;

const ProductSchema = new Schema(
    {
        codigo: { type: String, required: true, unique: true},
        nombre: { type: String, required: true },
        categoria: { type: String, required: true, enum: CATEGORIAS },
        descripcion: { type: String, default: "" },
        precio: { type: Number, required: true, min: 0 },
        stock: { type: Number, required: true,  min: 0, default: 0 },
        imagen: { type: String, default: "" },
        marca: { type: String, default: "" },
    },
    { timestamps: true }
);

export type ProductType = InferSchemaType<typeof ProductSchema>;
export default models.Product || model("Product", ProductSchema);
