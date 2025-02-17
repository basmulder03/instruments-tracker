import { randomInt } from 'crypto';

/**
 * Generates a secure password.
 * - Uses non-repeating characters if possible.
 * - Allows repeating characters only when requested length exceeds the total unique characters.
 *
 * @param length - Desired length of the password.
 * @returns A generated password string.
 * @throws Error if the length is less than 4.
 */
export function generatePassword(length: number): string {
    // Define character sets.
    const lowercase: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const uppercase: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const digits: string[] = '0123456789'.split('');
    const special: string[] = '!@#$%^&*()_+[]{}|;:,.<>?'.split('');

    // Create the complete unique pool.
    const allUnique: string[] = [...lowercase, ...uppercase, ...digits, ...special];
    const availableUnique = allUnique.length;

    if (length < 4) {
        throw new Error("Password length must be at least 4.");
    }

    // Helper function: picks a random character from an array and removes it.
    const getRandomChar = (arr: string[]): string => {
        const idx = randomInt(arr.length);
        const char = arr[idx]!;
        arr.splice(idx, 1);
        return char;
    };

    // If length is less than or equal to the total unique characters,
    // generate a password without repeating any character.
    if (length <= availableUnique) {
        const passwordChars: string[] = [];

        // Ensure at least one character from each category.
        passwordChars.push(getRandomChar(lowercase));
        passwordChars.push(getRandomChar(uppercase));
        passwordChars.push(getRandomChar(digits));
        passwordChars.push(getRandomChar(special));

        // Combine remaining characters from all categories.
        const pool = [...lowercase, ...uppercase, ...digits, ...special];

        // Fill the rest of the password without allowing duplicates.
        for (let i = 0; i < length - 4; i++) {
            passwordChars.push(getRandomChar(pool));
        }

        // Shuffle the resulting array securely.
        for (let i = passwordChars.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [passwordChars[i], passwordChars[j]] = [passwordChars[j]!, passwordChars[i]!];
        }

        return passwordChars.join('');
    } else {
        // When length exceeds available unique characters:
        // 1. Use all unique characters.
        // 2. For the extra characters, allow repetition by randomly picking from the full unique set.
        const passwordChars: string[] = [...allUnique];
        const extraCount = length - availableUnique;

        for (let i = 0; i < extraCount; i++) {
            // Repetition is allowed here.
            const idx = randomInt(allUnique.length);
            passwordChars.push(allUnique[idx]!);
        }

        // Since allUnique contains at least one character from each category,
        // the mandatory inclusion requirement is automatically met.

        // Shuffle the entire password array securely.
        for (let i = passwordChars.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [passwordChars[i], passwordChars[j]] = [passwordChars[j]!, passwordChars[i]!];
        }
        return passwordChars.join('');
    }
}
