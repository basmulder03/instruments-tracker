import {type DefaultJWT} from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { compare } from "bcryptjs";

import { db } from "~/server/db";
import {mutationLog} from "~/server/helpers/mutationLog";
import { signInSchema } from "~/types/signIn";

type Permission = {
    name: string;
};

type Role = {
    name: string;
    permissions: Permission[];
};

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
    interface User {
        roles?: Role[];
    }

    interface JWT extends DefaultJWT {
        roles: string[];
        permissions: string[];
    }

    interface SessionUser {
        roles: string[];
        permissions: string[];
    }

    interface Session extends DefaultSession {
        user: SessionUser & DefaultSession["user"];
    }
}

/**
 * NextAuth configuration options.
 */
export const authConfig = {
    adapter: PrismaAdapter(db),
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Validate credentials using safeParse to avoid throwing errors.
                const result = signInSchema.safeParse(credentials);
                if (!result.success) {
                    return null;
                }
                const parsedCredentials = result.data;

                // Look up the user by email, selecting only the necessary fields.
                const user = await db.user.findUnique({
                    where: { email: parsedCredentials.email },
                    select: {
                        id: true,
                        email: true,
                        hashedPassword: true,
                        roles: {
                            select: {
                                name: true,
                                permissions: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                });

                // If the user isn't found or the password doesn't match, return null.
                if (!user || !(await compare(parsedCredentials.password, user.hashedPassword))) {
                    return null;
                }

                // Log the sign-in event.
                await mutationLog.addMutationLog(db, user.id, "Auth Module", `User: ${user.id} signed in`);

                return user;
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            // When first signing in, add user details (including roles and permissions) to the JWT.
            if (user) {
                token.id = user.id;

                token.roles = user.roles?.map((role) => role.name) ?? [];
                token.permissions = user.roles?.flatMap((role) => role.permissions) ?? [];
            }
            return token;
        },
        // @ts-expect-error really not sure why this is throwing an error
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    // Cast token.id to string to satisfy the type requirement.
                    id: token.id as string,
                    name: token.name,
                    roles: token.roles,
                    permissions: token.permissions,
                },
            };
        },
    },
} satisfies NextAuthConfig;
