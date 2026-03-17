import { useState, useMemo } from 'react'

export type SortDir = 'asc' | 'desc' | null

export interface SortState<K extends string> {
  key: K | null
  dir: SortDir
}

export interface UseSortingResult<T, K extends string> {
  sortState: SortState<K>
  sorted: T[]
  onSort: (key: K) => void
}

/**
 * Generic client-side sort hook.
 *
 * @param items   The full (already-filtered) array to sort.
 * @param getValue  Given an item and a sort key, return the comparable value
 *                  (string | number | boolean | null | undefined).
 * @param defaultKey  Optional initial sort key (dir defaults to 'asc').
 * @param defaultDir  Optional initial sort direction (defaults to 'asc').
 *
 * Clicking the same column cycles: asc → desc → null (unsorted).
 * Clicking a different column always starts at asc.
 */
export function useSorting<T, K extends string>(
  items: T[],
  getValue: (item: T, key: K) => string | number | boolean | null | undefined,
  defaultKey: K | null = null,
  defaultDir: SortDir = 'asc',
): UseSortingResult<T, K> {
  const [sortState, setSortState] = useState<SortState<K>>({
    key: defaultKey,
    dir: defaultKey ? defaultDir : null,
  })

  function onSort(key: K) {
    setSortState((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      if (prev.dir === 'desc') return { key: null, dir: null }
      return { key, dir: 'asc' }
    })
  }

  const sorted = useMemo(() => {
    const { key, dir } = sortState
    if (!key || !dir) return items

    return [...items].sort((a, b) => {
      const av = getValue(a, key)
      const bv = getValue(b, key)

      // nulls / undefined always last
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1

      const cmp =
        typeof av === 'string' && typeof bv === 'string'
          ? av.localeCompare(bv, undefined, { sensitivity: 'base' })
          : typeof av === 'boolean' && typeof bv === 'boolean'
            ? Number(av) - Number(bv)
            : (av as number) < (bv as number)
              ? -1
              : (av as number) > (bv as number)
                ? 1
                : 0

      return dir === 'asc' ? cmp : -cmp
    })
  }, [items, sortState, getValue])

  return { sortState, sorted, onSort }
}
