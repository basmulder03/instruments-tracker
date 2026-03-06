import { useMemo, type ReactNode } from 'react';
import { AbilityContext } from '@/contexts/AbilityContext';
import { defineAbilityFor, defineEmptyAbility } from '@/lib/ability';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Rebuilds the CASL AppAbility whenever the current user (and their
 * permissions) changes, and provides it via AbilityContext.
 *
 * Must be rendered inside <AuthProvider>.
 */
export function AbilityProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();

  const ability = useMemo(
    () => (currentUser ? defineAbilityFor(currentUser) : defineEmptyAbility()),
    [currentUser],
  );

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
