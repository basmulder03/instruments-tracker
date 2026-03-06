import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import type { Actions, Subjects } from '@/lib/types/permissions';
import type { User } from '@/lib/types/users';

// ---------------------------------------------------------------------------
// App-level ability type
// ---------------------------------------------------------------------------

export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Builds a CASL `AppAbility` instance for the given user based on their
 * `permissions` array.
 *
 * Permission string format: `resource:action`
 *
 * Special cases:
 *   - `*:*`         → `can('manage', 'all')`  (super admin)
 *   - `resource:*`  → `can('manage', resource)` (all actions on resource)
 *   - `resource:action` → `can(action, resource)`
 */
export function defineAbilityFor(user: User): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  for (const permission of user.permissions) {
    if (permission === '*:*') {
      can('manage' as Actions, 'all' as Subjects);
      continue;
    }

    const colonIndex = permission.indexOf(':');
    if (colonIndex === -1) continue; // malformed – skip

    const resource = permission.slice(0, colonIndex);
    const action = permission.slice(colonIndex + 1);

    if (action === '*') {
      can('manage' as Actions, resource as Subjects);
    } else {
      can(action as Actions, resource as Subjects);
    }
  }

  return build();
}

/**
 * Creates a minimal "no permissions" ability, used before a user is
 * loaded or when no user is signed in.
 */
export function defineEmptyAbility(): AppAbility {
  const { build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  return build();
}
