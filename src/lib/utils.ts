import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A palette of visually distinct background / foreground pairs that look good
 * both in light and dark mode.  Each entry is a Tailwind-safe inline style pair
 * so we can apply them without safelisting dynamic class names.
 */
const AVATAR_PALETTE: Array<{ bg: string; fg: string }> = [
  { bg: '#e11d48', fg: '#fff' }, // rose-600
  { bg: '#db2777', fg: '#fff' }, // pink-600
  { bg: '#9333ea', fg: '#fff' }, // purple-600
  { bg: '#4f46e5', fg: '#fff' }, // indigo-600
  { bg: '#2563eb', fg: '#fff' }, // blue-600
  { bg: '#0891b2', fg: '#fff' }, // cyan-600
  { bg: '#059669', fg: '#fff' }, // emerald-600
  { bg: '#16a34a', fg: '#fff' }, // green-600
  { bg: '#ca8a04', fg: '#fff' }, // yellow-600
  { bg: '#ea580c', fg: '#fff' }, // orange-600
  { bg: '#dc2626', fg: '#fff' }, // red-600
  { bg: '#7c3aed', fg: '#fff' }, // violet-600
  { bg: '#0284c7', fg: '#fff' }, // sky-600
  { bg: '#0d9488', fg: '#fff' }, // teal-600
  { bg: '#65a30d', fg: '#fff' }, // lime-600
]

/**
 * Deterministically pick a palette entry for a given name string.
 * Uses a simple djb2-style hash so the same name always produces the same color.
 */
export function nameToAvatarStyle(name: string): { backgroundColor: string; color: string } {
  let hash = 5381
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 33) ^ name.charCodeAt(i)
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length
  const { bg, fg } = AVATAR_PALETTE[index]
  return { backgroundColor: bg, color: fg }
}

/** Extract up to two initials from a display name or email address. */
export function getInitials(name: string): string {
  if (!name) return '?'
  // If it looks like an email, use the local part before @
  const display = name.includes('@') ? name.split('@')[0] : name
  return display
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
