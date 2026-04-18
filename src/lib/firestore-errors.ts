import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const OPERATION_VERB: Record<OperationType, string> = {
  [OperationType.CREATE]: 'save',
  [OperationType.UPDATE]: 'update',
  [OperationType.DELETE]: 'delete',
  [OperationType.LIST]: 'load',
  [OperationType.GET]: 'load',
  [OperationType.WRITE]: 'save',
};

function getFirestoreErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return null;
}

function getUserFacingMessage(error: unknown, operationType: OperationType): string {
  const verb = OPERATION_VERB[operationType] || 'process';
  const code = getFirestoreErrorCode(error);
  const raw = error instanceof Error ? error.message : String(error);

  if (code === 'permission-denied' || raw.includes('Missing or insufficient permissions')) {
    return `You don't have permission to ${verb} this. Try signing in again.`;
  }
  if (code === 'unauthenticated') {
    return `Please sign in to ${verb} your projects.`;
  }
  if (code === 'unavailable' || raw.includes('the client is offline') || raw.includes('Failed to get document')) {
    return `Can't reach the database. Check your connection and try again.`;
  }
  if (code === 'deadline-exceeded') {
    return `The request timed out. Please try again.`;
  }
  if (code === 'resource-exhausted') {
    return `Too many requests. Please wait a moment and try again.`;
  }
  return `Couldn't ${verb} your project. Please try again.`;
}

/**
 * Log structured error info to the console for debugging and return a safe,
 * user-facing message. Does not throw — callers decide how to surface the error.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): string {
  const code = getFirestoreErrorCode(error);
  console.error('Firestore error', {
    operation: operationType,
    path,
    code,
    message: error instanceof Error ? error.message : String(error),
    userId: auth.currentUser?.uid ?? null,
  });
  return getUserFacingMessage(error, operationType);
}
