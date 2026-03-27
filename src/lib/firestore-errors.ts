import { auth } from "./firebase";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
}

export interface FirestoreErrorInfo {
  message: string;
  operationType: OperationType;
  path: string | null;
  userId?: string;
}

/**
 * Logs a structured Firestore error with auth context.
 * Does not re-throw — callers handle the original error flow.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const info: FirestoreErrorInfo = {
    message: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    userId: auth.currentUser?.uid,
  };
  console.error("Firestore error:", info);
}
