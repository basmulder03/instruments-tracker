// app/page.tsx
import { redirect } from "next/navigation";
import { db } from "~/server/db";

export default async function Home() {
  // Check if any user with the admin role exists
  const adminCount = await db.user.count({
    where: {
      roles: {
        some: { name: "admin" },
      },
    },
  });

  // Redirect accordingly
  if (adminCount > 0) {
    // Admin account exists so redirect to sign in page
    redirect("/auth/signin");
  } else {
    // No admin exists; redirect to admin setup page
    redirect("/auth/setup-admin");
  }
}
