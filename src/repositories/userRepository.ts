// User Repository
// Akses database untuk user

import { db, usersTable } from "../db";
import { eq } from "drizzle-orm";

export async function findByEmail(email: string) {
  // Note: users table uses 'username' column, not 'email'
  return db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, email))
    .limit(1);
}

export async function findByUsername(username: string) {
  return db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
}

export async function createUser(user: any) {
  return db.insert(usersTable).values(user).returning();
}

export async function findById(id: string) {
  return db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
}
