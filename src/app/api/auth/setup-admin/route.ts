import bcrypt from "bcryptjs";
import {NextResponse} from "next/server";
import {db} from "~/server/db";
import {setupAdminSchema} from "~/types/setupInitialAdmin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = setupAdminSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({error: result.error.flatten()}, {status: 400});
        }
        const {name, email, password} = result.data;

        // Check if any users exist in the database.
        const userCount = await db.user.count();
        if (userCount > 0) {
            return NextResponse.json({error: "Admin user already exists"}, {status: 400});
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the admin user; assumes that a role with name "admin" already exists.
        const user = await db.user.create({
            data: {
                name,
                email,
                hashedPassword,
                roles: {
                    connect: { name: "admin" },
                },
            },
            select: { id: true, email: true, name: true },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating admin account", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}