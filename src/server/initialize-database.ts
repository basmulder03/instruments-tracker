import {type PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";
import {env} from "~/env";
import {generatePassword} from "~/helpers/passwordHelpers";
import {mutationLog} from "~/server/helpers/mutationLog";
import {defaultPermissionNames} from "~/server/permissions";
import {defaultRoles} from "~/server/roles";

export class DataSeeder {
    private static hasSeeded = false;

    /**
     * Seed the database with default data.
     * @param db
     */
    public static async seedDefaultData(db: PrismaClient): Promise<void> {
        if (DataSeeder.hasSeeded) {
            return;
        }

        console.log("=== Seeding system user ===");

        const hashedPassword = await bcrypt.hash(generatePassword(16), env.SALT_ROUNDS)

        const systemUserId = await db.user.upsert({
            where: { email: "system@system.system" },
            update: {},
            create: {
                name: "System",
                email: "system@system.system",
                hashedPassword: hashedPassword,
            },
            select: { id: true}
        });
        await mutationLog.addMutationLog(db, systemUserId.id, "Database Seeder", "Upserted system user");

        console.log("=== System user seeding complete ===");

        console.log("=== Seeding default roles and permissions ===");

        // Upsert each default permission.
        for (const permissionName of defaultPermissionNames) {
            await db.permission.upsert({
                where: { name: permissionName },
                update: {},
                create: { name: permissionName },
            });
            console.log(`Upserted permission: ${permissionName}`);
            await mutationLog.addMutationLog(db, systemUserId.id, "Database Seeder", `Upserted permission: ${permissionName}`);
        }

        // Upsert each default role, with its associated permissions.
        for (const role of defaultRoles) {
            await db.role.upsert({
                where: { name: role.name },
                update: {},
                create: {
                    name: role.name,
                }
            });
            console.log(`Upserted role: ${role.name} with permissions: ${role.permissions.join(", ")}`);

            // Now update the role's permissions. The "set" operator disconnects any
            // existing relations and connects the specified permissions.
            await db.role.update({
                where: { name: role.name },
                data: {
                    permissions: {
                        set: role.permissions.map((name) => ({ name })),
                    },
                },
            });
            await mutationLog.addMutationLog(db, systemUserId.id, "Database Seeder", `Upserted role: ${role.name} with permissions: ${role.permissions.join(", ")}`);
        }

        console.log("=== Default roles and permissions seeding complete ===");

        console.log("=== Add system role to system user ===");

        await db.user.update({
            where: { id: systemUserId.id },
            data: {
                roles: {
                    connect: {
                        name: "system"
                    }
                }
            }
        });

        DataSeeder.hasSeeded = true;
    }
}