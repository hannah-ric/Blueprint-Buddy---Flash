import { doc, updateDoc, deleteField, FieldValue } from "firebase/firestore";
import { db } from "./firebase";
import { handleFirestoreError, OperationType } from "./firestore-errors";

/**
 * Applies a partial update to a plan document. Returns null on success or a
 * user-friendly error message. Undefined values in `patch` become Firestore
 * field deletions so we don't leave stale keys behind.
 */
export async function updatePlanFields(
  planId: string,
  patch: Record<string, unknown>
): Promise<string | null> {
  try {
    const sanitized: Record<string, unknown | FieldValue> = {};
    for (const [key, value] of Object.entries(patch)) {
      sanitized[key] = value === undefined ? deleteField() : value;
    }
    await updateDoc(doc(db, "plans", planId), sanitized);
    return null;
  } catch (err) {
    return handleFirestoreError(err, OperationType.UPDATE, `plans/${planId}`);
  }
}
