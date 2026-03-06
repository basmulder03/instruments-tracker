import { useEffect, useState, useCallback } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/config/firebase'

type Theme = 'light' | 'dark'

/**
 * Manages dark mode state, persisting the preference both in localStorage
 * (for immediate next-load restoration) and in the user's Firestore doc.
 *
 * Applies the `dark` class to `<html>` as required by Tailwind's class strategy.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Initialise from localStorage so the theme is known before React hydrates
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Apply / remove the `dark` class on <html> whenever isDark changes
  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev

      // Persist to Firestore if signed in (best-effort, non-blocking)
      const uid = auth.currentUser?.uid
      if (uid) {
        updateDoc(doc(db, 'users', uid), {
          'preferences.theme': next ? 'dark' : 'light',
        }).catch(() => {
          // Non-critical
        })
      }

      return next
    })
  }, [])

  return { isDark, toggle }
}
