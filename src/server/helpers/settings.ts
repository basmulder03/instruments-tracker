import { PrismaClient } from "@prisma/client";
import {type SettingName} from "~/server/seeding/settings";

/**
 * Automatically parses a string value:
 * - Uses regexes to detect booleans, numbers, and null.
 * - If a class constructor is provided, assumes the value is JSON and deserializes it
 *   into an instance of that class.
 * - Otherwise, attempts JSON.parse to cover objects or arrays, falling back to the raw string.
 *
 * @param value - The stored string value.
 * @returns The parsed value cast to type T.
 */
function autoParse<T>(value: string): T {
    const trimmed = value.trim();

    // Check for boolean using regex.
    if (/^(true|false)$/i.test(trimmed)) {
        return (trimmed.toLowerCase() === 'true') as unknown as T;
    }

    // Check for a number.
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
        return Number(trimmed) as unknown as T;
    }

    // Check for a date.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(trimmed) || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return new Date(trimmed) as unknown as T;
    }

    // Check for the literal "null".
    if (trimmed === 'null') {
        return null as unknown as T;
    }

    // If not handled by the above, attempt to parse as JSON.
    return JSON.parse(value) as unknown as T;
}

/**
 * Retrieves a setting by its name from the database and automatically parses
 * its string value into the appropriate type.
 *
 * @param db
 * @param name - The unique name of the setting.
 * @returns A Promise that resolves with the parsed setting value as type T.
 *
 * @example
 * // For default types:
 * const signInTries = await getSetting<number>('user:signInTries');
 * const seedingComplete = await getSetting<boolean>('system:seedingComplete');
 *
 * @example
 * // For a custom class:
 * class MyCustomType { }
 * const customValue = await getSetting<MyCustomType>('custom:setting', MyCustomType);
 */
export async function getSetting<T = string>(
    db: PrismaClient,
    name: SettingName,
): Promise<T> {
    const setting = await db.setting.findUnique({
        where: { name },
        select: { value: true },
    });
    if (!setting) {
        throw new Error(`Setting "${name}" not found.`);
    }
    return autoParse<T>(setting.value);
}

export async function updateSetting<T>(
    db: PrismaClient,
    name: SettingName,
    value: T
): Promise<void> {
    await db.setting.update({
        where: { name },
        data: { value: JSON.stringify(value) }
    });
}
