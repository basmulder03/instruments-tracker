import { createContext, useContext } from 'react';
import { createContextualCan } from '@casl/react';
import { defineEmptyAbility, type AppAbility } from '@/lib/ability';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * Provides the current user's CASL `AppAbility` instance to the React tree.
 * Initialised with an empty (deny-all) ability so components are safe to
 * render before the auth state resolves.
 */
export const AbilityContext = createContext<AppAbility>(defineEmptyAbility());

AbilityContext.displayName = 'AbilityContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Hook to access the current `AppAbility` from any component.
 *
 * @example
 * const ability = useAbility();
 * if (ability.can('create', 'Instrument')) { ... }
 */
export function useAbility(): AppAbility {
  return useContext(AbilityContext);
}

/**
 * Declarative permission gate component powered by CASL.
 *
 * @example
 * <Can I="create" a="Instrument">
 *   <AddInstrumentButton />
 * </Can>
 */
export const Can = createContextualCan(AbilityContext.Consumer);
