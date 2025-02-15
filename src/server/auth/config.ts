import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import {compare} from "bcryptjs";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          console.log("test123")
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          console.log(credentials)

          // Find the user by email
          const user = await db.user.findUnique({
            where: { email: credentials.email as string }
          });

          console.log(user)

          // If the user doesn't exist or the password is wrong, return null
          if (!user || !(await compare(credentials.password as string, user.hashedPassword))) {
            return null;
          }

          return user;
        }
      })
  ],
  pages: {
    signIn: "/auth/signin"
  },
  session: {
    strategy: "jwt",
  }
} satisfies NextAuthConfig;
