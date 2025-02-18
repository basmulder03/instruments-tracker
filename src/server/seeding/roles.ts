import {PermissionName} from "~/server/seeding/permissions";

export interface DefaultRole {
    name: string;
    permissions: PermissionName[];
}

// Define the default roles that are available in the application.
export const defaultRoles: DefaultRole[] = [
    {
        name: "user",
        permissions: ["users:read"],
    },
    {
        name: "admin",
        permissions: ["users:read", "users:write"],
    },
    {
        name: "system",
        permissions: []
    }
];