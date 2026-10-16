import mongoose from "mongoose";

type Cache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

const g = globalThis as typeof globalThis & { mongooseCache?: Cache };
const cached: Cache = g.mongooseCache ?? { conn: null, promise: null };
g.mongooseCache = cached;

export async function connectDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Define MONGODB_URI en .env.local");

    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, {
            bufferCommands: false, 
            serverSelectionTimeoutMS: 5000,
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null; // permite reintentar si falló
        throw error;
    }
    return cached.conn;
}
