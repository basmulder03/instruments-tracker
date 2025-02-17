import bcrypt from "bcryptjs";
import {env} from "~/env";
import {createTRPCRouter, publicProcedure} from "~/server/api/trpc";
import {db} from "~/server/db";
import {mutationLog} from "~/server/helpers/mutationLog";
import {setupInitialAdminSchema} from "~/types/setupInitialAdmin";

export const setupAdminRouter = createTRPCRouter({
    setupAdmin: publicProcedure
        .input(
            setupInitialAdminSchema
        )
        .mutation(async ({ input }) => {
            // Check if any admin user exists
            const adminUserCount = await db.user.count({
                where: {
                    roles: {
                        some: {
                            name: "admin"
                        }
                    }
                }
            });

            if (adminUserCount > 0) {
                throw new Error("Admin user already exists");
            }

            // Hash the provided password
            const hashedPassword = await bcrypt.hash(input.password, env.SALT_ROUNDS);

            // Create the admin user
            const adminUser = await db.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    hashedPassword: hashedPassword,
                    roles: {
                        connect: {
                            name: "admin"
                        }
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });

            const systemUserId = await mutationLog.getSystemUserId(db);
            await mutationLog.addMutationLog(db, systemUserId, "Admin Setup", `Created admin user: ${adminUser.email}`);
            return adminUser;
        } )
});