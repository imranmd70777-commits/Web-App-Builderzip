import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";

const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "admin@example.com";
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "Admin123!";
const ADMIN_NAME = "Admin";

/**
 * Ensures a default admin account exists in the database.
 * This is idempotent — safe to call on every startup.
 * If the admin already exists, nothing is changed.
 */
export async function seedAdmin(): Promise<void> {
  try {
    const existing = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL))
      .limit(1);

    if (existing.length > 0) {
      logger.info({ email: ADMIN_EMAIL }, "Admin account already exists — skipping seed");
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.insert(usersTable).values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    });

    logger.info(
      { email: ADMIN_EMAIL },
      "✅ Default admin account created successfully",
    );

    // Print credentials visibly in startup logs so the deployer can see them
    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║         DEFAULT ADMIN CREDENTIALS        ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log(`║  Email   : ${ADMIN_EMAIL.padEnd(30)} ║`);
    console.log(`║  Password: ${ADMIN_PASSWORD.padEnd(30)} ║`);
    console.log("║  Login   : /login                        ║");
    console.log("╚══════════════════════════════════════════╝\n");
  } catch (err) {
    // A failed seed must never crash the server — log and continue
    logger.error({ err }, "Admin seed failed — server will still start");
  }
}
