// import { defineConfig } from "drizzle-kit";
// import path from "path";

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL, ensure the database is provisioned");
// }

// export default defineConfig({
//   schema: path.join(__dirname, "./src/db/schema/index.ts"),
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//   },
// });
import { defineConfig } from "drizzle-kit";
// Tambahkan import dotenv agar DATABASE_URL pasti terbaca saat push dari terminal
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env file");
}

export default defineConfig({
  // Ubah path ini agar langsung membaca semua file schema yang ada di folder tersebut
  schema: "./src/db/schema/**/*.ts", // atau "./src/db/schema.ts" jika hanya 1 file
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Tambahkan ini agar output terminal lebih detail saat ada error
  verbose: true,
  strict: true,
});