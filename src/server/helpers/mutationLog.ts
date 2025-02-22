import {type PrismaClient} from "@prisma/client";

export const mutationEntityNames = [
    "Database Seeder",
    "Admin Setup",
    "Auth Module"
] as const;

export type MutationEntity = typeof mutationEntityNames[number];

export const mutationEntityList: MutationEntity[] = [...mutationEntityNames];

class MutationLog {
    static systemUserId: string;

    /**
     * Add a mutation log to the database.
     * @param db
     * @param userId
     * @param entity
     * @param mutation
     */
    async addMutationLog(db: PrismaClient, userId: string, entity: MutationEntity, mutation: string): Promise<void> {
        await db.mutationLog.create({
            data: {
                entity,
                mutation,
                user: {
                    connect: {
                        id: userId
                    }
                }
            }
        });
    }

    /**
     * Get the system user from the database.
     * Cache the system user in memory for future use.
     * @param db
     */
    async getSystemUserId(db: PrismaClient): Promise<string> {
        if (MutationLog.systemUserId) {
            return MutationLog.systemUserId;
        }

        const systemUser = await db.user.findFirst({
            where: {
                roles: {
                    some: {
                        name: "system"
                    }
                }
            }
        });

        if (!systemUser) {
            throw new Error("System user not found");
        }
        console.log("System user found:", systemUser);
        MutationLog.systemUserId = systemUser.id;
        return systemUser.id;
    }
}

export const mutationLog = new MutationLog();
