import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface ComboboxInputProps {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  suggestions: string[]
  placeholder?: string
  id?: string
}

/**
 * Free-text input with a suggestion dropdown derived from previously-used
 * values.  The user can always type any arbitrary value — the suggestions are
 * purely advisory (soft autocomplete).
 *
 * Keyboard support:
 *   ArrowDown / ArrowUp — navigate suggestions
 *   Enter              — confirm highlighted suggestion
 *   Escape             — close dropdown
 */
export function ComboboxInput({
  value,
  onChange,
  onBlur,
  suggestions,
  placeholder,
  id,
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filtered suggestions: case-insensitive substring match, non-empty, unique
  const filtered = suggestions.filter(
    (s) => s && s.toLowerCase().includes(value.toLowerCase()) && s !== value,
  )

  function pick(suggestion: string) {
    onChange(suggestion)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      pick(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [value])

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (filtered.length > 0) setOpen(true)
        }}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-y-auto py-1"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === activeIndex}
              onPointerDown={(e) => {
                // Prevent blur from firing before the click registers
                e.preventDefault()
                pick(s)
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer ${
                i === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
