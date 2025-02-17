import { redirect } from "next/navigation";
import { db } from "~/server/db";
import SetupAdminForm from "./SetupAdminForm";

export const metadata = {
    title: "Setup Admin Account",
};

export default async function SetupAdminPage() {
    // Check if any users exist in the database.
    const adminCount = await db.user.count({
        where: {
            roles: {
                some: { name: "admin" },
            },
        }
    });
    if (adminCount > 0) {
        // If an account already exists, redirect to sign in (or your home page).
        redirect("/auth/signin");
    }

    return (
        <div>
            <SetupAdminForm />
        </div>
    );
}
