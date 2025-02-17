import {PrismaClient} from "@prisma/client";
import { env } from "~/env";
import {DataSeeder} from "~/server/initialize-database";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Ensure seeding happens only once per process.
// Disable the rules for this block to avoid linting errors.
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
if (!(global as any).__seededDefaults) {
    (global as any).__seededDefaults = true;
    DataSeeder.seedDefaultData(db).catch((error) => {
        console.error("Error seeding database:", error);
    });
}