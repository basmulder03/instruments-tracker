// Define a tuple of permission names that are available in the application.
export const defaultPermissionNames = [
    'users:read',
    'users:write'
] as const;

// Derive a literal union type from the tuple of permission names.
export type PermissionName = typeof defaultPermissionNames[number];

// Use the literal union type for list of default permissions.
export const defaultPermissions: PermissionName[] = [...defaultPermissionNames];
