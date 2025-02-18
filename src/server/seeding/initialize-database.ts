import {type PrismaClient} from "@prisma/client";
import {mutationLog} from "~/server/helpers/mutationLog";
import {defaultPermissionNames} from "~/server/seeding/permissions";
import {defaultRoles} from "~/server/seeding/roles";
import {defaultSettings} from "~/server/seeding/settings";
import {getSetting, updateSetting} from "~/server/helpers/settings";

/**
 * Seed the database with default data.
 * @param db
 */
export async function seedDefaultData(db: PrismaClient): Promise<void> {
    let hasSeededData: boolean;
    try {
        hasSeededData = await getSetting<boolean>(db, "system:seedingComplete");
    } catch {
        console.log("=== No seeding data found, start seeding ===");
        hasSeededData = false;
    }

    if (hasSeededData) {
        console.log("=== Seeding already complete ===");
        return;
    }

    console.log("=== Seeding system user ===");

    const systemUserId = await db.user.upsert({
        where: {email: ""},
        update: {},
        create: {
            name: "System",
            email: "",
            hashedPassword: "",
        },
        select: {id: true}
    });
    await mutationLog.addMutationLog(db, systemUserId.id, "Database Seeder", "Upserted system user");

    console.log("=== System user seeding complete ===");

    console.log("=== Seeding default settings ===");

    for (const defaultSetting of defaultSettings) {
        const setting = await db.setting.upsert({
            where: {name: defaultSetting.settingName},
            update: {},
            create: {
                name: defaultSetting.settingName,
                value: defaultSetting.value
            }
        });

        console.log(`Upserted setting: ${setting.name} with value: ${setting.value}`);
        await mutationLog.addMutationLog(db, systemUserId.id, "Database Seeder", `Upserted setting: ${setting.name} with value: ${setting.value}`);
    }

    console.log("=== Default settings seeding complete ===");

    console.log("=== Seeding default roles and permissions ===");

    // Upsert each default permission.
    for (const permissionName of defaultPermissionNames) {
        await db.permission.upsert({
            where: {name: permissionName},
            update: {},
            create: {name: permissionName},
        });
        console.log(`Upserted permission: ${permissionName}`);
        await mutationLog.addMutationLog(db, systemUserId.id, "Database Seeder", `Upserted permission: ${permissionName}`);
    }

    // Upsert each default role, with its associated permissions.
    for (const role of defaultRoles) {
        await db.role.upsert({
            where: {name: role.name},
            update: {},
            create: {
                name: role.name,
            }
        });
        console.log(`Upserted role: ${role.name} with permissions: ${role.permissions.join(", ")}`);

        // Now update the role's permissions. The "set" operator disconnects any
        // existing relations and connects the specified permissions.
        await db.role.update({
            where: {name: role.name},
            data: {
                permissions: {
                    set: role.permissions.map((name) => ({name})),
                },
            },
        });
        await mutationLog.addMutationLog(db, systemUserId.id, "Database Seeder", `Upserted role: ${role.name} with permissions: ${role.permissions.join(", ")}`);
    }

    console.log("=== Default roles and permissions seeding complete ===");

    console.log("=== Add system role to system user ===");

    await db.user.update({
        where: {id: systemUserId.id},
        data: {
            roles: {
                connect: {
                    name: "system"
                }
            }
        }
    });

    await updateSetting(db, "system:seedingComplete", true);
}