import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

// ---------------------------------------------------------------------------
// Collection → prefix mapping
// ---------------------------------------------------------------------------

const PREFIX_MAP: Record<string, string> = {
  instruments: 'INS',
  people: 'PER',
  locations: 'LOC',
  movements: 'MOV',
  maintenance: 'MNT',
  usage_events: 'USE',
  audit_log: 'AUD',
  invitations: 'INV',
};

function getPrefix(collectionName: string): string {
  return PREFIX_MAP[collectionName] ?? 'GEN';
}

/**
 * Generates the next sequential ID for a given Firestore collection.
 *
 * Format: `PREFIX-####`  e.g. "INS-0042"
 *
 * The Firestore document ID is used directly as the identifier (e.g. the
 * document at `instruments/INS-0042` has document ID "INS-0042"). There is
 * no need to store a separate ID field — `docSnap.id` is the source of truth.
 *
 * NOTE: This implementation scans all document IDs and finds the current
 * maximum. It is intentionally simple and suitable for low-write-volume
 * scenarios. For high-concurrency use cases, switch to a Firestore counter
 * document or Cloud Function.
 */
export async function generateNextId(collectionName: string): Promise<string> {
  const prefix = getPrefix(collectionName);
  const snapshot = await getDocs(collection(db, collectionName));

  let maxNum = 0;

  snapshot.forEach((docSnap) => {
    const match = docSnap.id.match(/^[A-Z]+-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
}

/**
 * Formats an existing numeric counter into a prefixed ID string.
 * Useful when you already have the next number from a counter document.
 */
export function formatId(collectionName: string, num: number): string {
  const prefix = getPrefix(collectionName);
  return `${prefix}-${num.toString().padStart(4, '0')}`;
}
